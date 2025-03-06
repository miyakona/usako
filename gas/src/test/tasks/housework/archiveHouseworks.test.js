const ArchiveHouseworks = require('../../../tasks/housework/archiveHouseworks');
const commandBase = require('../../../classes/commandBase');

// Houseworkをモック化
global.Housework = jest.fn().mockImplementation(() => ({
  getSheet: jest.fn(),
}));

// SpreadsheetAppをモック化
global.SpreadsheetApp = {
  setActiveSheet: jest.fn(),
  getActiveSpreadsheet: jest.fn().mockReturnValue({
    duplicateActiveSheet: jest.fn().mockReturnValue({
      setName: jest.fn(),
    }),
  }),
  openByUrl: jest.fn().mockReturnValue({
    getSheetByName: jest.fn(),
    deleteSheet: jest.fn(),
  }),
  getActive: jest.fn().mockReturnValue({
    deleteSheet: jest.fn(),
  }),
  getActiveSheet: jest.fn().mockReturnValue({
    getName: jest.fn().mockReturnValue('家事代_202502'),
  }),
};

// PropertiesServiceをモック化
global.PropertiesService = {
  getScriptProperties: jest.fn().mockReturnValue({
    getProperty: jest.fn().mockReturnValue('https://example.com/spreadsheet'),
  }),
};

// Loggerをモック化
global.Logger = {
  log: jest.fn(),
};

// commandBaseのmainメソッドをモック化
jest.spyOn(commandBase.prototype, 'main').mockImplementation(function() {
  this.run();
});

describe('ArchiveHouseworks', () => {
  let archiveHouseworks;
  let mockHousework;
  let mockSheet;
  let mockDate;

  beforeEach(() => {
    mockSheet = {
      deleteRows: jest.fn(),
      getLastRow: jest.fn().mockReturnValue(10),
    };

    mockHousework = {
      getSheet: jest.fn().mockReturnValue(mockSheet),
    };

    global.Housework.mockImplementation(() => mockHousework);

    // Dateをモック化
    mockDate = new Date('2025-02-09'); // 日曜日
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    archiveHouseworks = new ArchiveHouseworks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(archiveHouseworks.name).toBe('家事アーカイブバッチ');
    });
  });

  describe('run', () => {
    it('第一日曜日の場合はアーカイブを実行すること', () => {
      // 第一日曜日
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(2);

      archiveHouseworks.run();

      expect(global.Logger.log).toHaveBeenCalledWith('called ArchiveHouseworks:run()');
      expect(mockHousework.getSheet).toHaveBeenCalled();
      expect(global.SpreadsheetApp.setActiveSheet).toHaveBeenCalledWith(mockSheet);
      expect(global.SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName).toHaveBeenCalledWith('家事代_202502');
      expect(mockSheet.deleteRows).toHaveBeenCalledWith(2, 9);
    });

    it('第一日曜日以外の場合はアーカイブを実行しないこと', () => {
      // 第二日曜日
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(9);

      archiveHouseworks.run();

      expect(global.Logger.log).toHaveBeenCalledWith('called ArchiveHouseworks:run()');
      expect(mockHousework.getSheet).not.toHaveBeenCalled();
      expect(global.SpreadsheetApp.setActiveSheet).not.toHaveBeenCalled();
      expect(global.SpreadsheetApp.getActiveSpreadsheet().duplicateActiveSheet().setName).not.toHaveBeenCalled();
      expect(mockSheet.deleteRows).not.toHaveBeenCalled();
    });

    it('前々月分のシートを削除すること', () => {
      // 第一日曜日
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(2);

      const mockDeleteTargetSheet = {
        deleteSheet: jest.fn(),
      };

      global.SpreadsheetApp.openByUrl().getSheetByName.mockReturnValue(mockDeleteTargetSheet);

      archiveHouseworks.run();

      expect(global.SpreadsheetApp.openByUrl).toHaveBeenCalledWith('https://example.com/spreadsheet');
      expect(global.SpreadsheetApp.openByUrl().getSheetByName).toHaveBeenCalledWith('家事代_202502');
      expect(global.SpreadsheetApp.getActive().deleteSheet).toHaveBeenCalledWith(mockDeleteTargetSheet);
    });
  });
}); 