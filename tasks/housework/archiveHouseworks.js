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

    const dt = new Date();
    // その月の第一日曜日でないならアーカイブを実行しない
    if ((Math.floor((dt.getDate() - 1 ) / 7) + 1) != 1) {
      return;
    }
    const housework = new Housework(); // eslint-disable-line no-undef
    const currentSheet = housework.getSheet();
    SpreadsheetApp.setActiveSheet(currentSheet);

    // 年月(YYYYMM)の名前でシートをアーカイブ
    const thisMonth = dt.getMonth() == 0 ? 12 : dt.getMonth();
    const thisYear  = thisMonth == 12 ? dt.getFullYear() - 1: dt.getFullYear();
    const prefix = '家事代_';
    SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName(`${prefix}${String(thisYear)}${String(("0"+(thisMonth)).slice(-2))}`);

    // 前々月分を削除する
    const lastMonth = new Date(dt.getFullYear(), dt.getMonth()-2, dt.getDate());
    const targetDate = `${prefix}${String(lastMonth.getFullYear())}${String(("0"+(lastMonth.getMonth()+1)).slice(-2))}`;
    const deleteTargetSheet = SpreadsheetApp.openByUrl(PropertiesService.getScriptProperties().getProperty('MAIN_SHEET')).getSheetByName(targetDate);
    SpreadsheetApp.getActive().deleteSheet(deleteTargetSheet);

    // シートをクリア
    currentSheet.deleteRows(2, currentSheet.getLastRow() - 1);
  }
}

function archiveHouseworks () { // eslint-disable-line no-unused-vars
  const batch = new ArchiveHouseworks();
  batch.main();
}