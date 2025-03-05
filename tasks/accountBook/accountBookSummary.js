class AccountBookSummary extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('出費のサマリ通知バッチ');
  }

  main () {
    super.main();
  }

  /**
   * 家計簿の内容から、それぞれの支払内容を通知する & 月のサマリデータを更新する
   * 毎月26日 PM7〜8時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const accountBook = new AccountBook(); // eslint-disable-line no-undef
    const line = new LineMessagingApi(); // eslint-disable-line no-undef
    const dt = new Date();
    const currentData = this.aggregate(dt, accountBook.getVariableCost(), accountBook.getFixedCost());
    const summarySheet = accountBook.getSummarySheet();
    const variableCostSheet = accountBook.getVariableCostSheet();

    // サマリを通知
    line.pushAll(`${String(dt.getMonth() + 1)}月がはじまるよ！
共通財布の中身の整理と、それぞれ担当分の生活費を支払ってね

${accountBook.getSummary()}`);
    // サマリシート更新
    this.update(summarySheet, currentData);

    // 前年同月比を通知
    line.pushAll(this.getMessage(this.getDiff(summarySheet), currentData, accountBook.getGraph()));
    variableCostSheet.clear();
  }

  /**
   * 出費を集計する
   *
   * @param Date dt 日付オブジェクト
   * @param array variables 変動費
   * @param array constants 固定費
   * @return array 集計結果
   */
  aggregate(dt, variableCost, fixedCost) {
    Logger.log('called ' + this.constructor.name + ':aggregate()');
    // フォームの選択肢に依存
    var aggregateResult = {
      '食費' : 0,
      '雑費' : 0,
      'その他' : 0,
      'ガス' : 0,
      '電気' : 0,
      '水道' : 0,
      '車' : 0,
      '嗜好品' : 0,
      '外食' : 0,
      '炭酸水' : 0,
      '日付' : Number(dt.getFullYear()) + '/' + String(("0"+(dt.getMonth() + 1)).slice(-2))
    };

    for(var vKey in variableCost) {
      if (Number(variableCost[vKey][1]) <= Number(dt.getFullYear()) && Number(variableCost[vKey][2]) <= Number(dt.getMonth() + 1)) {
        aggregateResult[variableCost[vKey][3]] += variableCost[vKey][4];
      }
    }

    for(var fKey in fixedCost) {
        aggregateResult[fixedCost[fKey][0]] = fixedCost[fKey][1];
    }

    return aggregateResult;
  }

  /**
   * サマリシートに今月分を追記・グラフシートの描画データを更新する
   *
   * @param object summarySheet サマリ用のシート
   * @param array  currentData 今月の出費
   */
  update(summarySheet, currentData) {
    Logger.log('called ' + this.constructor.name + ':update()');
    // 記入項目に対する行のマップを設定
    const indexes = summarySheet.getRange(1, 1, summarySheet.getLastRow(), 1).getValues();
    const inverseObject = function(obj, keyIsNumber) {
      return Object.keys(obj).reduceRight(function (ret, k) {
        return (ret[obj[k]] = keyIsNumber ? parseInt(k, 10) : k, ret);
      }, {})
    };
    const map = inverseObject(indexes, true);

    // サマリシートに当月分追記
    var column = summarySheet.getLastColumn();
    column = Number(column);
    for (let key in currentData) {
      summarySheet.getRange(Number(map[key]) + 1, column).setValue(currentData[key]);
    }

    // 来月分追記
    let lastColumn = Number(summarySheet.getLastColumn()) + 1;
    for (let key in currentData) {
      if (key == '日付') {
        let dt = new Date();
        let nextMonth = new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
        let date = `${nextMonth.getFullYear()}/${String(("0"+(nextMonth.getMonth() + 1)).slice(-2))}`
        summarySheet.getRange(Number(map[key]) + 1, lastColumn).setValue(date);
      } else {
        summarySheet.getRange(Number(map[key]) + 1, lastColumn).setValue(`=SUMIF('家計簿_今月'!$D:$D,"${key}",'家計簿_今月'!$E:$E) `);
      }
    }
  }

  /**
   * 前月比、前年同月比を取得する
   *
   * @param object sheet サマリシートのオブジェクト
   * @return array 前月比、前年同月比
   */
  getDiff(sheet) {
    Logger.log('called ' + this.constructor.name + ':getDiff()');
    // 記入項目に対する行のマップを取得
    const indexes = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();

    // 今月、前月、前年同月のデータを取得
    const current   = sheet.getRange(1, sheet.getLastColumn(), sheet.getLastRow(), 1).getValues();
    const lastMonth = sheet.getRange(1, sheet.getLastColumn() - 1, sheet.getLastRow(), 1).getValues();
    const lastYear  = sheet.getRange(1, sheet.getLastColumn() - 12, sheet.getLastRow(), 1).getValues();

    var diffLastMonth = {};
    var diffLastYear  = {};
    for (var key in current) {
      if (key == 0) {
        // 日付の比較はしない
        continue;
      }
      diffLastMonth[indexes[key]] = current[key] - lastMonth[key];
      diffLastYear[indexes[key]]  = current[key] - lastYear[key];
    }

    return {
      'lastMonth' : diffLastMonth,
      'lastYear' : diffLastYear
    };
  }

  /**
   * 前月・前年同月比を通知する
   *
   * @param array diff 前月・前年同月比のデータ
   * @param array current 今月のデータ
   * @param string graph グラフデータの URL
   */
  getMessage(diff, current, graph) {
    Logger.log('called ' + this.constructor.name + ':getMessage()');
    // 計算に使えない要素を削除
    delete current['日付'];

    // 合計値を求める関数を定義
    const sum = function(arr){
      var res = 0;
      for (var value in arr) {
        res += arr[value];
      }
      return res;
    };

    const formatter = new Intl.NumberFormat('ja-JP');
    return `今月の出費のおしらせだよ

今月の出費は合計で ${formatter.format(sum(current))} 円 でした。
今月は、先月に比べて ${sum(diff['lastMonth']) > 0 ? '+' : ''}${formatter.format(sum(diff['lastMonth']))} 円 でした。
${sum(diff['lastMonth']) < 0 ? '節約頑張ったね！' : ''}
ちなみに、去年の同じ月と比べると、 ${formatter.format(sum(diff['lastYear']))}円 の差があるよ！

比べてみて、どうだったかな？来月も頑張ろう♪

直近12ヶ月のグラフはここから見れるよ！
更新が確認できない場合は時間を置いてアクセスしてみてね
${graph}`;
  }
}

function accountBookSummary () { // eslint-disable-line no-unused-vars
  const batch = new AccountBookSummary();
  batch.main();
}