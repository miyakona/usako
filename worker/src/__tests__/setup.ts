import { jest } from '@jest/globals';

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

// Jest の型定義を追加
type JestDescribe = (description: string, callback: () => void) => void;
type JestIt = (description: string, callback: () => void) => void;
type JestExpect = (actual: any) => any;

// グローバルスコープに Jest の関数を追加
(global as any).describe = jest.describe as JestDescribe;
(global as any).it = jest.it as JestIt;
(global as any).expect = jest.expect as JestExpect;

// デバッグ用のログ
console.log('Setup file loaded successfully');

// プレースホルダーテスト
describe('Setup', () => {
  it('should be a placeholder test', () => {
    expect(true).toBe(true);
  });
}); 