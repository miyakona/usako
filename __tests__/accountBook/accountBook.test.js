const AccountBook = require('../../claasess/accountBook');

// モックの設定
jest.mock('google-apps-script', () => ({
  SpreadsheetApp: {
    openByUrl: jest.fn(),
    getActiveSpreadsheet: jest.fn(),
    setActiveSheet: jest.fn(),
  },
  PropertiesService: {
    getScriptProperties: jest.fn(() => ({
      getProperty: jest.fn((key) => {
        const properties = {
          'MAIN_SHEET': 'https://example.com/spreadsheet',
          'GRAPH_ACCOUNT_BOOK': 'https://example.com/graph',
          'IMG_ACCOUNT_BOOK': 'https://example.com/image',
          'FORM_ACCOUNT_BOOK': 'https://example.com/form',
          'USER1_NAME': 'User1',
          'USER2_NAME': 'User2',
        };
        return properties[key];
      }),
    })),
  },
}));

describe('AccountBook', () => {
  let accountBook;
  let mockSheet;
  let originalDate;

  beforeEach(() => {
    // モックシートの設定
    mockSheet = {
      getLastRow: jest.fn(),
      getRange: jest.fn(),
      getValues: jest.fn(),
      clear: jest.fn(),
    };

    // SpreadsheetAppのモック設定
    require('google-apps-script').SpreadsheetApp.openByUrl.mockReturnValue({
      getSheetByName: jest.fn((name) => {
        if (name === '家計簿_今月') return mockSheet;
        if (name === '家計簿_固定費') return mockSheet;
        if (name === '家計簿_サマリ') return mockSheet;
        return null;
      }),
    });

    accountBook = new AccountBook();
  });

  afterEach(() => {
    if (originalDate) {
      global.Date = originalDate;
    }
  });

  describe('getMessage', () => {
    describe('26日以降の場合、来月の月を返す', () => {
      it('1月26日に実行する場合、2月を返す', () => {
        const mockDate = new Date('2024-01-26');
        originalDate = global.Date;
        global.Date = jest.fn(() => mockDate);
        global.Date.prototype = Object.create(Date.prototype);
        global.Date.prototype.getDate = jest.fn(() => 26);
        global.Date.prototype.getMonth = jest.fn(() => 0); // 0-based month (January)
        global.Date.prototype.getFullYear = jest.fn(() => 2024);

        const result = accountBook.getMessage('report');
        expect(result).toContain('entry.220269951=2024&entry.1155173829=02');
      });

      it('12月26日に実行する場合、翌年1月を返す', () => {
        const mockDate = new Date('2024-12-26');
        originalDate = global.Date;
        global.Date = jest.fn(() => mockDate);
        global.Date.prototype = Object.create(Date.prototype);
        global.Date.prototype.getDate = jest.fn(() => 26);
        global.Date.prototype.getMonth = jest.fn(() => 11); // 0-based month (December)
        global.Date.prototype.getFullYear = jest.fn(() => 2024);

        const result = accountBook.getMessage('report');
        expect(result).toContain('entry.220269951=2025&entry.1155173829=01');
      });
    });

    it('26日以前の場合、今月の月を返す', () => {
      const mockDate = new Date('2024-12-25');
      originalDate = global.Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.prototype = Object.create(Date.prototype);
      global.Date.prototype.getDate = jest.fn(() => 25);
      global.Date.prototype.getMonth = jest.fn(() => 11); // 0-based month (December)
      global.Date.prototype.getFullYear = jest.fn(() => 2024);

      const result = accountBook.getMessage('report');
      expect(result).toContain('entry.220269951=2024&entry.1155173829=12');
    });
  });
}); 