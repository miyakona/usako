class Chat { // eslint-disable-line no-unused-vars
  constructor() {
    this.sheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')).getSheetByName('うさこの言葉');
    this.imgUrl = PropertiesService.getScriptProperties().getProperty('IMG_CHAT');
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
      "title" : "うさことおしゃべり",
      "text" : "登録された言葉以外で話しかけると、私とおしゃべりできるよ♪",
      "actions" : [{
        "type":"message",
        "label":"おしゃべり！",
        "text":"うさこ〜〜〜"
      }]
    };
  }

  /**
   * ランダムにメッセージを取得する
   *
   * @return string メッセージ
   */
  getMessage() {
    Logger.log('called ' + this.constructor.name + ':getMessage()');
    const message = this.sheet.getRange(1, 1, this.sheet.getLastRow(), 1).getValues();
    return message[Math.floor(Math.random() * message.length)];
  }
}

module.exports = Chat;
