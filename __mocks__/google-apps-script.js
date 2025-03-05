const SpreadsheetApp = {
  openByUrl: jest.fn(),
  getActiveSpreadsheet: jest.fn(),
  setActiveSheet: jest.fn(),
};

const PropertiesService = {
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

const Logger = {
  log: jest.fn(),
};

module.exports = {
  SpreadsheetApp,
  PropertiesService,
  Logger,
}; 