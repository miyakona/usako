const AccountBookSummary = require('../../../tasks/accountBook/accountBookSummary');

// SpreadsheetAppをモック化
global.SpreadsheetApp = {
  openByUrl: jest.fn().mockReturnValue({
    getSheetByName: jest.fn().mockReturnValue({
      getRange: jest.fn().mockReturnValue({
        getValues: jest.fn(),
        setValue: jest.fn(),
      }),
      getLastColumn: jest.fn().mockReturnValue(5),
    }),
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

describe('AccountBookSummary', () => {
  let accountBookSummary;
  let mockSheet;

  beforeEach(() => {
    mockSheet = {
      getRange: jest.fn().mockReturnValue({
        getValues: jest.fn(),
        setValue: jest.fn(),
      }),
      getLastColumn: jest.fn().mockReturnValue(5),
    };

    global.SpreadsheetApp.openByUrl().getSheetByName.mockReturnValue(mockSheet);

    accountBookSummary = new AccountBookSummary();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(accountBookSummary.name).toBe('出費のサマリ通知バッチ');
    });
  });

  describe('aggregate', () => {
    it('変動費と固定費を正しく集計すること', () => {
      const dt = new Date('2025-02-09');
      const variableCost = [
        ['2025', '2', '食費', '食費', 1000],
        ['2025', '2', '雑費', '雑費', 2000],
      ];
      const fixedCost = [
        ['ガス', 3000],
        ['電気', 4000],
      ];

      const result = accountBookSummary.aggregate(dt, variableCost, fixedCost);

      expect(result).toEqual({
        '食費': 0,
        '雑費': 0,
        'その他': 0,
        'ガス': 3000,
        '電気': 4000,
        '水道': 0,
        '嗜好品': 0,
        '外食': 0,
        '炭酸水': 0,
        '車': 0,
        '日付': '2025/02',
      });
    });
  });
}); 