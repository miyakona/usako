class NotifyHouseworkSummary extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('実施家事のサマリ通知バッチ');
  }

  main () {
    super.main();
  }

  /**
   * 毎週の家事サマリを通知
   * 毎週日曜 AM1〜2時実行
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');

    const housework = new Housework(); // eslint-disable-line no-undef
    const sheet = housework.getSheet();
    const user1 = housework.getUser1Name();
    const user2 = housework.getUser2Name();

    // 通知未送信分がなければ何もしない
    const unnotified = this.getUnnotified(user1, sheet.getRange(2, 2, sheet.getLastRow() - 1, 5).getValues());
    if (unnotified['user1'].length < 1 && unnotified['user2'].length < 1) {
      return;
    }

    const summary = {
      'user1' : this.getSummary(user1, unnotified['user1']),
      'user2' : this.getSummary(user2, unnotified['user2']),
    };

    // 通知を送信
    const line = new LineMessagingApi(); // eslint-disable-line no-undef
    const graph = housework.getGraph();
    line.pushAll(this.getFormattedMessage(user1, user2, summary, graph));

    // メール送信した項目に「済」を記載
    for(var i = 2; i <= sheet.getLastRow(); i++){
      sheet.getRange(i, 6).setValue('済');
    }
  }

  /**
   * 未通知分を取得する
   *
   * @param string user1 ユーザー1の名前（実施者の判定に利用する）
   * @param array reported 報告済家事
   * @return array 未通知の家事
   */
  getUnnotified(user1, reported) {
    Logger.log('called ' + this.constructor.name + ':getUnnotified()');
    var unnotified = {
      'user1' : [],
      'user2' : [],
    };

    for (var key in reported){
      if (reported[key][4] == '済') {
        continue;
      }

      if (reported[key][0] == user1){
        unnotified['user1'].push(reported[key][1]);
      } else {
        unnotified['user2'].push(reported[key][1]);
      }
    }

    return unnotified;
  }

  /**
   * サマリを取得するメソッド。
   *
   * @param string user 集計対象者の名前
   * @param array context 何をやったのか
   * @return array どの家事を何回やったか、合計いくら支払われる必要があるのか、の配列
   */
  getSummary(user, context) {
    Logger.log('called ' + this.constructor.name + ':getSummary()');
    var sum = 0;
    var did = [];
    for(var key in context){
      // 家事の回数を計算
      did.push(context[key]);

      // 合計支払額の計算
      sum += this.getSpendingMoney(user, context[key]);
    }

    // 重複カウント関数
    const countDuplicate = function(arr){
      return arr.reduce(function(counts, key){
        counts[key] = (counts[key])? counts[key] + 1 : 1 ;
        return counts;
      }, {});
    };

    return {
      'sumMoney' : sum,
      'didCount' : countDuplicate(did)
    };
  }

  /**
   * 支払金テーブルから支払い金を取得するメソッド。
   *
   * @param string who  やった人
   * @param string what やった家事
   * @return int|string 支払い金
   */
  getSpendingMoney(who, what){
    Logger.log(`called ${this.constructor.name}: getSpendingMoney() who=${who}, what=${what}`);

    // 参照列の設定
    const referringSheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')).getSheetByName('支払金テーブル');
    let header = referringSheet.getRange(1, 2, 1, 2).getValues(); // ユーザーの名前部分のみ抽出
    header = header[0][0].split(',');
    const referringColumn = header[0] == who ? 2 : 3;

    // 参照行の設定
    var refferingRow = 0;
    const houseworks = referringSheet.getRange(2, 1, referringSheet.getLastRow() - 1).getValues();
    var index = 2;
    for(var key in houseworks){
      if (houseworks[key] == what) {
        refferingRow = index;
        break;
      }
      index++;
    }

    return referringSheet.getRange(refferingRow, referringColumn).getValue();
  }

  /**
   * 通知用にメッセージを整形する
   *
   * @param string user1 ユーザー1の名前
   * @param string user2 ユーザー2の名前
   * @param array summary 実施済家事のサマリ
   * @param string graph グラフの URL
   */
  getFormattedMessage(user1, user2, summary, graph) {
    const dt = new Date();
    let weeklyBeginning = new Date(dt);
    weeklyBeginning.setDate(dt.getDate() - 8);

    const formatDate = (date) => {
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    };

    const term = `${formatDate(weeklyBeginning)} 〜 ${formatDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 1))}`;

    var message = `今週の家事実績報告！
${term}

今週も家事おつかれさまでした。
家事を対応してくれた人に、それぞれ以下の金額を渡してあげてください。

 ${user1}に ${summary['user1']['sumMoney']}円
 ${user2}に ${summary['user2']['sumMoney']}円

一週間の対応内容の詳細は以下です。

`;
    // 何を何回やったか
    message += '■ ' + user1 + '\n';
    Object.keys(summary['user1']['didCount']).forEach(function(what){
      message += '　' + what + ' ' + summary['user1']['didCount'][what] + '回\n';
    });
    message += '\n■ ' + user2 + '\n';
    Object.keys(summary['user2']['didCount']).forEach(function(what){
      message += '　' + what + ' ' + summary['user2']['didCount'][what] + '回\n';
    });

    message += `\nこれまでの全体の実績は以下シートを参照してね。
${PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')}`;

    message += `\n今月の実績はここから見てね。
${graph}`;

    return message;
  }
}

function notifyHouseworkSummary () { // eslint-disable-line no-unused-vars
  const batch = new NotifyHouseworkSummary();
  batch.main();
}