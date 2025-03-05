const mockSheet = {
  getLastRow: jest.fn(),
  getRange: jest.fn(),
  getValues: jest.fn(),
  clear: jest.fn(),
};

global.commandBase = class {
  constructor(name) {
    this.name = name;
  }

  main() {
    // 何もしない
  }
};

global.SpreadsheetApp = {
  openByUrl: jest.fn().mockReturnValue({
    getSheetByName: jest.fn((name) => {
      if (name === '家計簿_今月') return mockSheet;
      if (name === '家計簿_固定費') return mockSheet;
      if (name === '家計簿_サマリ') return mockSheet;
      return null;
    }),
  }),
  getActiveSpreadsheet: jest.fn(),
  setActiveSheet: jest.fn(),
};

global.PropertiesService = {
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
};

global.Logger = {
  log: jest.fn(),
}; 