// Google Apps Script APIのグローバルモック
global.SpreadsheetApp = {
  openByUrl: jest.fn(),
  getActiveSpreadsheet: jest.fn(),
  openById: jest.fn()
};

global.UrlFetchApp = {
  fetch: jest.fn()
};

global.PropertiesService = {
  getScriptProperties: jest.fn().mockReturnValue({
    getProperty: jest.fn(),
    setProperty: jest.fn()
  })
};

global.Logger = {
  log: jest.fn()
}; 