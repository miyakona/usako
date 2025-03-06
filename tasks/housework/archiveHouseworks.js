const commandBase = require('../../claasess/commandBase');

class ArchiveHouseworks extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('家事アーカイブバッチ');
  }

  main () {
    super.main();
  }

  /**
   * 記入されたシートをアーカイブし、記入シートをきれいにする
   * 毎週日曜日 AM2〜3時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    // 第一日曜日かどうかをチェック
    const isFirstSunday = dayOfWeek === 0 && dayOfMonth <= 7;

    if (!isFirstSunday) {
      return;
    }

    const housework = new global.Housework();
    const currentSheet = housework.getSheet();
    global.SpreadsheetApp.setActiveSheet(currentSheet);

    // 年月(YYYYMM)の名前でシートをアーカイブ
    const thisMonth = today.getMonth() + 1;
    const thisYear = today.getFullYear();
    const prefix = '家事代_';
    global.SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName(`${prefix}${String(thisYear)}${String(("0"+thisMonth).slice(-2))}`);

    // 前々月分を削除する
    const lastMonth = new Date(today.getFullYear(), today.getMonth()-2, 1);
    const targetDate = `${prefix}${String(lastMonth.getFullYear())}${String(("0"+(lastMonth.getMonth()+1)).slice(-2))}`;
    const deleteTargetSheet = global.SpreadsheetApp.openByUrl(global.PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')).getSheetByName(targetDate);
    if (deleteTargetSheet) {
      global.SpreadsheetApp.getActive().deleteSheet(deleteTargetSheet);
    }

    // シートをクリア
    currentSheet.deleteRows(2, currentSheet.getLastRow() - 1);
  }
}

function archiveHouseworks () { // eslint-disable-line no-unused-vars
  const batch = new ArchiveHouseworks();
  batch.main();
}

module.exports = ArchiveHouseworks;