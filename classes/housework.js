class Housework { // eslint-disable-line no-unused-vars
  constructor() {
    this.sheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')).getSheetByName('家事代_今月');
    this.imgUrl = PropertiesService.getScriptProperties().getProperty('IMG_HOUSEWORK');
    this.formUrl = PropertiesService.getScriptProperties().getProperty('FORM_HOUSEWORK');
    this.user1Id = PropertiesService.getScriptProperties().getProperty('USER1_ID');
    this.user2Id = PropertiesService.getScriptProperties().getProperty('USER2_ID');
    this.user1Name = PropertiesService.getScriptProperties().getProperty('USER1_NAME');
    this.user2Name = PropertiesService.getScriptProperties().getProperty('USER2_NAME');
    this.graph = PropertiesService.getScriptProperties().getProperty('GRAPH_HOUSEWORK');
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
      "title" : "家事管理",
      "text" : "実施した家事の報告や報告内容の確認ができるよ！\n毎週日曜日に決算するよ♪",
      "actions" : [{
        "type":"message",
        "label":"使ってみる",
        "text":"家事管理"
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
          "label": "実施家事を報告する",
          "data": '{"type":"housework", "action":"report"}'
        },
        {
          "type": "postback",
          "label": "報告済家事を確認する",
          "data": '{"type":"housework", "action":"confirm"}'
        }
      ],
      "image" : this.imgUrl,
      "imageAspectRatio" : "square",
      "imageSize" : "contain",
      "title" : "家事管理",
      "altText" : "家事管理テンプレート",
      "text" : "家事管理だね。\n報告？それとも確認？"
    };
  }

  /**
   * アクションに応じたメッセージを取得する
   * @param string action  実行内容の識別子
   * @param string userId 送信元のユーザID
   * @return string 返答
   */
  getMessage(action, userId) {
    Logger.log('called ' + this.constructor.name + ':getMessage()');
    const dt = new Date();
    const date = String(dt.getFullYear()) + '-' + String(("0"+(dt.getMonth() + 1)).slice(-2)) + '-' + String(("0"+(dt.getDate())).slice(-2));
    switch(action) {
      // 報告済家事の確認
      case "confirm":
        return this.getDoneList(userId);
      // 家事の報告
      case "report":
        return `家事報告だね！
${this.formUrl}?usp=pp_url&entry.1025033203=${date}`;
      default:
        return 'エラー。意図しないアクションが指定されました。';
    }
  }

  /**
   * 実行済の家事リストを取得する
   *
   * @param string userId 話しかけた人のID
   * @return string 返事
   */
  getDoneList(userId) {
    Logger.log('called ' + this.constructor.name + ':getDoneList() userId: ' + userId);

    // IDから話しかけた人を特定
    const userName = userId == this.user1Id ? this.user1Name : this.user2Name;

    // 未実施のときのコメントを設定
    const messageUnexecuted = '今日はまだ家事をやってないみたい。\n報告するときは、「フォーム」って話しかけてね！';

    const lastRow = this.sheet.getLastRow() - 1;
    if (lastRow < 2) { // ヘッダ行があるため、報告は2行目以降
      return messageUnexecuted;
    }
    const achievement = this.sheet.getRange(2, 2, lastRow, 5).getValues();

    var text = '報告済の家事はこれだよ！\n';
    var isDone = false;
    for (var key in achievement){
      if (achievement[key][4] == '済') {
        continue;
      }
      // 報告済 && 未支払いの家事をリストに追記する
      if (String(achievement[key][0]) == String(userName)) {
        isDone = true;
        let targetDate = new Date(String(achievement[key][2]));
        text = text + (targetDate.getMonth() + 1) + '/' + targetDate.getDate() + ' ' + String(achievement[key][1]) + '\n';
      }
    }

    // リストの返却
    if (!isDone) {
      return messageUnexecuted;
    }
    text = text + '\n報告漏れあったかな？';
    return text;
  }

  /**
   * 家事報告のシートを取得する
   */
  getSheet() {
    return this.sheet;
  }

  /**
   * ユーザー1の名前を取得する
   */
  getUser1Name() {
    return this.user1Name;
  }

  /**
   * ユーザー2の名前を取得する
   */
  getUser2Name() {
    return this.user2Name;
  }

  /**
   * グラフのURLを取得（≠シート）
   */
  getGraph() {
    return this.graph;
  }
}