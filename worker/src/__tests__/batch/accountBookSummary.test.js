"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accountBookSummary_1 = require("../../batch/accountBookSummary");
const lineMessaging_1 = require("../../services/lineMessaging");
const googleSheets_1 = require("../../services/googleSheets");
jest.mock('../../services/lineMessaging');
jest.mock('../../services/googleSheets');
describe('AccountBookSummaryHandler', () => {
    let accountBookSummaryHandler;
    let mockLineService;
    let mockGoogleSheetsService;
    let mockEnv;
    beforeEach(() => {
        mockEnv = {
            LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
            LINE_CHANNEL_SECRET: 'test-secret',
            SPREADSHEET_ID: 'test-spreadsheet',
            GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
            GOOGLE_SHEETS_CREDENTIALS: 'test-credentials',
            GOOGLE_SHEETS_SPREADSHEET_ID: 'test-sheets-id',
        };
        const MockLineMessagingService = lineMessaging_1.LineMessagingService;
        const MockGoogleSheetsService = googleSheets_1.GoogleSheetsService;
        mockLineService = new MockLineMessagingService(mockEnv);
        mockGoogleSheetsService = new MockGoogleSheetsService(mockEnv);
        mockLineService.pushAll = jest.fn();
        mockGoogleSheetsService.getAccountBookSummary = jest.fn().mockResolvedValue('月次サマリテスト');
        accountBookSummaryHandler = new accountBookSummary_1.AccountBookSummaryHandler(mockEnv, mockLineService, mockGoogleSheetsService);
    });
    describe('run method', () => {
        it('should get account book summary and push to line', async () => {
            await accountBookSummaryHandler['run']();
            expect(mockGoogleSheetsService.getAccountBookSummary).toHaveBeenCalled();
            expect(mockLineService.pushAll).toHaveBeenCalledWith('月次サマリテスト');
        });
        it('should handle errors during summary retrieval', async () => {
            const testError = new Error('Summary retrieval failed');
            mockGoogleSheetsService.getAccountBookSummary.mockRejectedValue(testError);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await accountBookSummaryHandler['run']();
            expect(mockLineService.pushAll).toHaveBeenCalledWith(expect.stringContaining('出費のサマリ通知バッチの実行に失敗しました。'));
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
    describe('handleMessage method', () => {
        it('should throw an error when called', async () => {
            await expect(accountBookSummaryHandler.handleMessage('test-token', 'test-message')).rejects.toThrow('Not implemented');
        });
    });
});
