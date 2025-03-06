class Purchase { // eslint-disable-line no-unused-vars
  constructor() {
    this.sheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')).getSheetByName('買い出しリスト');
    this.imgUrl = PropertiesService.getScriptProperties().getProperty('IMG_PURCHASE');

    // コマンド入力例を定義
    this.commandSampleAdd =`買い出し
xxx
yyy
欲しい`;
    this.commandSampleDelete =`買い出し
xxx
yyy
買ったよ`;
    this.commandSampleList =`買い出し
リスト`;
    this.commandSampleDeleteAll =`買い出し
全消し`;
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
      "title" : "買い出しリストの管理",
      "text" : "買い出しリストの操作ができるよ！\nリストは、2人とも参照可能だよ",
      "actions" : [{
        "type" : "message",
        "label" : "リストを見てみる",
        "text" : this.commandSampleList
      }]
    };
  }

  /**
   * コマンド呼び出し
   *
   * @param string message 受信したメッセージ
   * @return string 返信メッセージ
   */
  getMessage(message) {
    Logger.log('called ' + this.constructor.name + ':getMessage()');
    var splitted = message.split(/\r\n|\n/);

    if (splitted.length < 2) {
      return `フォーマットエラーだよ！
以下のいずれかで書いてね。

①リストを確認
${this.commandSampleList}

②リストから削除
${this.commandSampleDelete}

③リストに追加
${this.commandSampleAdd}

③リストから全削除
${this.commandSampleDeleteAll}

※xxx, yyyには品目名を入力してね。`;
    }

    splitted.shift(); // 冒頭の `買い出し` を削除
    const command = String(splitted[splitted.length - 1]);
    switch (command) {
      case 'リスト':
        return this.getList();
      case '買ったよ':
        splitted.pop(); // 末尾の `買ったよ` を削除
        return this.delete(splitted);
      case '欲しい':
        splitted.pop(); // 末尾の `欲しい` を削除
        return this.add(splitted);
      case '全消し':
        return this.deleteAll();
      default:
        return '「リスト」「買ったよ」「欲しい」のどれかで話しかけて…！！！';
    }
  }

  /**
   * 買い出しリストを取得する
   *
   * @return string 買い出しリスト
   */
  getList() {
    Logger.log('called ' + this.constructor.name + ':getList()');
    const lastRow = this.sheet.getLastRow() - 1;
    const messageNone = `今登録されている品目はないよ。
ほしいものがあったら

${this.commandSampleAdd}

で教えてね！`;

    if (lastRow < 1) {
      return messageNone;
    }
    const items = this.sheet.getRange(2, 1, lastRow, 2).getValues();

    var text = `買い出しリストには、いま以下の品目が登録されてるよ！

`;
    var isNone = true;
    for(var key in items) {
      if (items[key][1] != '済') {
        isNone = false;
        text += String(items[key][0]) + '\n';
      }
    }

    if (isNone) {
      return messageNone;
    }
    text +=`
買い出しが終わったら

${this.commandSampleDelete}

でリストから削除できるよ！`;
    return text;
  }

  /**
   * 買い出しリストにあるものをすべて削除する
   */
  deleteAll() {
    const messageNoTarget = `まだリストに登録されてるものが無いみたい。

${this.commandSampleList}

でリストにある品目を確認してね`;

    const lastRow = this.sheet.getLastRow() - 1;

    if (lastRow < 1) {
      return messageNoTarget;
    }

    const items = this.sheet.getRange(2, 1, lastRow, 2).getValues();

    var isNone = true;
    for (var itemKey in items) {
      if (items[itemKey][1] != '済') {
        isNone = false;
        const range = this.sheet.getRange(Number(itemKey) + 2, 2);
        range.setValue('済');
      }
    }

    if (isNone) {
      return messageNoTarget;
    }

    return 'リストから品目を消しておいたよ〜';
  }

  /**
   * 買い出しリストから品目を削除する
   *
   * @param array target 削除対象リスト
   * @return string 実行完了メッセージ
   */
  delete(target) {
    Logger.log('called ' + this.constructor.name + ':delete()');
    const messageNoTarget = `教えてもらった品目がリストに無いよ！

${this.commandSampleList}

でリストにある品目を確認してね`;
    const lastRow = this.sheet.getLastRow() - 1;

    if (target.length < 1 || lastRow < 1) {
      return messageNoTarget;
    }
    const items = this.sheet.getRange(2, 1, lastRow, 2).getValues();

    var isNone = true;
    for (var taegetKey in target) {
      for (var itemKey in items) {
        if (items[itemKey][1] != '済' && String(target[taegetKey]) == items[itemKey][0]) {
          isNone = false;
          const range = this.sheet.getRange(Number(itemKey) + 2, 2);
          range.setValue('済');
        }
      }
    }

    if (isNone) {
      return messageNoTarget;
    }

    return 'リストから品目を消しておいたよ〜';
  }

  /**
   * 買い出しリストに品目追加
   *
   * @param array target 追加対象リスト
   * @return string 実行完了メッセージ
   */
  add(target) {
    Logger.log('called ' + this.constructor.name + ':add()');
    if (target.length < 1) {
      return `品目が指定されていないみたいだよ。

${this.commandSampleAdd}

で追加してね！`;
    }

    for (var key in target) {
      let lastRow = this.sheet.getLastRow() + 1;
      this.sheet.setActiveCell('A' + lastRow).setValue(target[key]);
    }

    return `買い出しリストに追加しておいたよ！
リストの内容を見るには

${this.commandSampleList}

で教えてね`;
  }

  /**
   * 買い出しリストのシートを取得
   *
   * @return Sheet 買い出しリスト
   */
  getSheet() {
    return this.sheet;
  }
}

module.exports = Purchase;