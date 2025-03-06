const Purchase = require('../claasess/purchase');

class DeletePurchased extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('買い出しリスト整理バッチ');
  }

  main () {
    super.main();
  }

  /**
   * 買い出しリスト整理バッチ
   * 毎日 AM3〜4時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const purchase = new Purchase();
    const sheet = purchase.getSheet();
    const lastRow = sheet.getLastRow() - 1;

    // 買い出しリストに登録がなければ後続処理を実行しない
    if (lastRow < 1) {
      return;
    }

    const items = sheet.getRange(2, 1, lastRow, 2).getValues();
    const deleteRows = [];
    for (const key in items) {
      if (items[key][1] == '済') {
        /**
         * keyはヘッダ行を除く2行目を添字0としている。
         * そのためヘッダ行を除く1行目（シート全体では2行目）を指定したいとき、以下で算出される。
         * key:0 + 2 = ヘッダ行を除く1行目
         */
        deleteRows.push(Number(key) + 2);
      }
    }

    // 別の行を消さないようにするため、検索とは逆順で行を削除
    for (let i = deleteRows.length - 1; i > -1; i--) {
      sheet.deleteRow(deleteRows[i]);
    }
  }
}

function deletePurchased () { // eslint-disable-line no-unused-vars
  const batch = new DeletePurchased();
  batch.main();
}

module.exports = DeletePurchased;