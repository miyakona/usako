class AccountBook { // eslint-disable-line no-unused-vars
  constructor() {
    const mainSheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('MAIN_SHEET'));
    this.variableCostSheet = mainSheet.getSheetByName('家計簿_今月');
    this.fixedCostSheet = mainSheet.getSheetByName('家計簿_固定費');
    this.summarySheet = mainSheet.getSheetByName('家計簿_サマリ');
    this.graph = PropertiesService.getScriptProperties().getProperty('GRAPH_ACCOUNT_BOOK');
    this.imgUrl = PropertiesService.getScriptProperties().getProperty('IMG_ACCOUNT_BOOK');
    this.formUrl = PropertiesService.getScriptProperties().getProperty('FORM_ACCOUNT_BOOK');
    this.user1 = PropertiesService.getScriptProperties().getProperty('USER1_NAME');
    this.user2 = PropertiesService.getScriptProperties().getProperty('USER2_NAME');
  }

  /**
   * チュートリアルに表示するためのテンプレートに利用する配列を取得する
   *
   * @return string json配列
   */
  getTemplateColumn() {
    Logger.log('called ' + this.constructor.name + ':getTemplateColumn()');
    return {
      "thumbnailImageUrl" : this.imgUrl,
      "title" : "家計簿管理",
      "text" : "生活費の報告と、報告内容の確認ができるよ\n毎月25日に決算だよ！",
      "actions" : [{
        "type":"message",
        "label":"使ってみる",
        "text":"家計簿"
      }]
    };
  }

  /**
   * 家事管理で利用するボタンテンプレート
   *
   * @return string json配列
   */
  getButtonTemplateAction() {
    Logger.log('called ' + this.constructor.name + ':getButtonTemplateAction()');
    return {
      "action" : [
        {
          "type": "postback",
          "label": "出費を書き込む",
          "data": '{"type":"accountBook", "action":"report"}'
        },{
          "type": "postback",
          "label": "報告済の支出を確認する",
          "data": '{"type":"accountBook", "action":"check"}'
        },{
          "type": "postback",
          "label": "支払額の中間報告を見る",
          "data": '{"type":"accountBook", "action":"summary"}'
        }
      ],
      "image" : this.imgUrl,
      "imageAspectRatio" : "square",
      "imageSize" : "contain",
      "title" : "家計簿",
      "altText" : "家計管理テンプレート",
      "text" : "家計管理だね。\n報告？それとも確認？"
    };
  }

  /**
   * 指定されたアクションに応じたメッセージを返却する
   *
   * @param string action アクション
   * @return string メッセージ
   */
  getMessage(action) {
    Logger.log('called ' + this.constructor.name + ':getMessage()');
    const dt = new Date();
    let year = dt.getFullYear();
    let month = dt.getMonth() + 1;

    if (dt.getDate() >= 26) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    const remindComment = '出費は毎月25日までに報告してね！26日に支払い金額を通知するよ！';
    switch(action) {
      // 家計簿に記入
      case 'report':
        return `家計の報告だね！
${this.formUrl}?usp=pp_url&entry.220269951=${year}&entry.1155173829=${String(month).padStart(2, '0')}`;
      // サマリの中間報告
      case 'summary' :
      return `現時点での支払内容はこんな感じだよ！

${this.getSummary()}
毎月と比較してどうかな？

${remindComment}`;
      case 'check' :
      return `報告済の支出だよ！

${this.getReported()}

${remindComment}`;
      default:
        return 'エラー。意図しないアクションが指定されました。';
    }
  }

  /**
   * 実行時点での報告済家計を取得する
   */
   getReported() {
    Logger.log('called ' + this.constructor.name + ':getReported()');

    const variableCost = this.getVariableCost();

    if (variableCost.length < 1) {
      return '報告済の支出はないみたい。';
    }

    var text ='';

    // 変動費の詳細
    const dt = new Date();
    for(var key in variableCost){
      // 実施日より過去分であれば対象にする
      if (Number(variableCost[key][1]) <= Number(dt.getFullYear()) && Number(variableCost[key][2]) <= Number(dt.getMonth() + 1))
      {
        text += `${variableCost[key][3]}: ${variableCost[key][4]}円（${variableCost[key][0]}）
`;
      }
    }

    return text;
   }

  /**
   * 実行時点での支払いサマリを取得する
   */
  getSummary() {
    Logger.log('called ' + this.constructor.name + ':getSummary()');

    const variableCost = this.getVariableCost();
    const fixedCost = this.getFixedCost();

    const payment = this.getPayment(variableCost, fixedCost);
    const detail = this.getDetail(variableCost, fixedCost);

    var text = `${this.user1}さん支払い分 : ${payment['user1']}円
${this.user2}さん支払い分 : ${payment['user2']}円

支払いの内訳は以下だよ。
(凡例) [分類] : [価格] （出した人）
`;
    for(var key in detail)
    {
      text += detail[key][0] + ' : ' + detail[key][1] + '円 （' + detail[key][2] + '）\n';
    }
    return text;
  }

  /**
   * どちらにいくら払うのか、計算する
   *
   * @param array variableCost 変動費
   * @param array fixedCost 固定費
   * @retrun array どちらにいくら払うのか、の配列
   */
  getPayment(variableCost, fixedCost) {
    Logger.log('called ' + this.constructor.name + ':getPayment()');
    var paymentUser1 = 0;
    var paymentUser2 = 0;

    const dt = new Date();
    for(var vKey in variableCost){
      // 実施日より過去分であれば加算する
      if (Number(variableCost[vKey][1]) <= Number(dt.getFullYear()) && Number(variableCost[vKey][2]) <= Number(dt.getMonth() + 1))
      {
        if (variableCost[vKey][0] == this.user1){
          paymentUser1 += variableCost[vKey][4];
        }
        else if (variableCost[vKey][0] == this.user2)
        {
          paymentUser2 += variableCost[vKey][4];
        }
      }
    }

    // 固定費から家計を計算
    for (var fKey in fixedCost){
      if (fixedCost[fKey][2] == this.user1) {
        paymentUser1 += fixedCost[fKey][1];
      } else {
        paymentUser2 += fixedCost[fKey][1];
      }
    }

    // それぞれの支払った半額を払い合うため、キーと計算に使うユーザーは入れ替える
    return {
      'user1' : paymentUser2 / 2,
      'user2'  : paymentUser1 / 2,
    };
  }

  getDetail(variableCost, fixedCost) {
    Logger.log('called ' + this.constructor.name + ':getDetail()');
    var detail = [];

    // 変動費の詳細
    const dt = new Date();
    for(var key in variableCost){
      // 実施日より過去分であれば対象にする
      if (Number(variableCost[key][1]) <= Number(dt.getFullYear()) && Number(variableCost[key][2]) <= Number(dt.getMonth() + 1))
      {
        if (variableCost[key][0] == this.user2 || variableCost[key][0] == this.user1)
        {
          detail.push(
            [
              variableCost[key][3], // 用途
              variableCost[key][4], // 額面
              variableCost[key][0]  // 払った人
            ]
          );
        }
      }
    }

    // 固定費の詳細をマージ
    detail = detail.concat(fixedCost);

    return detail;
  }

  /**
   * 変動費を取得
   */
  getVariableCost() {
    Logger.log('called ' + this.constructor.name + ':getVariableCost()');
    const lastRow = this.variableCostSheet.getLastRow();
    return lastRow < 1 ? [] : this.variableCostSheet.getRange(1, 1, lastRow, 5).getValues();
  }

  /**
   * 固定費を取得
   */
  getFixedCost() {
    Logger.log('called ' + this.constructor.name + ':getFixedCost()');
    const lastRow = this.fixedCostSheet.getLastRow();
    return lastRow < 1 ? [] : this.fixedCostSheet.getRange(1, 1, lastRow, 3).getValues();
  }

  /**
   * サマリシートを取得
   */
  getSummarySheet() {
    Logger.log('called ' + this.constructor.name + ':getSummarySheet()');
    return this.summarySheet;
  }

  /**
   * 変動費シートを取得
   */
  getVariableCostSheet() {
    Logger.log('called ' + this.constructor.name + ':getVariableCostSheet()');
    return this.variableCostSheet;
  }

  /**
   * グラフのURLを取得（≠シート）
   */
  getGraph() {
    return this.graph;
  }
}

module.exports = AccountBook;