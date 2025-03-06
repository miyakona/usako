// Google Apps Script APIのモック
const googleAppsScriptMock = {
  SpreadsheetApp: {
    openByUrl: jest.fn(),
    getActiveSpreadsheet: jest.fn(),
    openById: jest.fn()
  },
  UrlFetchApp: {
    fetch: jest.fn()
  },
  PropertiesService: {
    getScriptProperties: jest.fn().mockReturnValue({
      getProperty: jest.fn(),
      setProperty: jest.fn()
    })
  },
  Logger: {
    log: jest.fn()
  }
};

module.exports = googleAppsScriptMock; 