"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// モックの設定
jest.mock('@line/bot-sdk');
jest.mock('google-spreadsheet');
jest.mock('googleapis');
// 環境変数の設定
process.env.SPREADSHEET_ID = 'test-spreadsheet-id';
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
process.env.LINE_CHANNEL_SECRET = 'test-secret';
process.env.GOOGLE_SERVICE_ACCOUNT_KEY = 'test-key';
process.env.GOOGLE_SHEETS_CREDENTIALS = 'test-credentials';
process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'test-sheets-id';
// デバッグ用のログ
console.log('Setup file loaded successfully');
// プレースホルダーテスト
(0, globals_1.describe)('Setup', () => {
    (0, globals_1.it)('should be a placeholder test', () => {
        (0, globals_1.expect)(true).toBe(true);
    });
});
