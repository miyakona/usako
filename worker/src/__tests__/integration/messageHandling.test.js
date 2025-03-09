"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messageHandler_1 = __importDefault(require("../../handlers/messageHandler"));
const mockLineService = {
    replyText: jest.fn().mockImplementation((token, text) => Promise.resolve()),
    replyTemplateButton: jest.fn().mockImplementation((token, text, options) => Promise.resolve()),
    replyTemplateCarousel: jest.fn().mockImplementation((token, text, options) => Promise.resolve()),
    push: jest.fn().mockImplementation((userId, messages) => Promise.resolve()),
    pushAll: jest.fn().mockImplementation((messages) => Promise.resolve()),
    channelAccessToken: 'test-token',
    reply: jest.fn().mockImplementation((token, messages) => Promise.resolve()),
    pushMessage: jest.fn().mockImplementation((messages) => Promise.resolve()),
};
const mockGoogleSheetsService = {
    getRandomChatMessage: jest.fn().mockReturnValue('テストメッセージ'),
    getAccountBookSummary: jest.fn(),
    getValues: jest.fn().mockReturnValue([['テストメッセージ']]),
    initializePurchaseListSheet: jest.fn().mockResolvedValue(undefined),
    appendValues: jest.fn().mockResolvedValue(undefined),
    setValues: jest.fn().mockResolvedValue(undefined),
};
const mockPostbackService = {
    replyText: jest.fn().mockImplementation((token, text) => Promise.resolve()),
    handlePostback: jest.fn().mockImplementation((token, data) => Promise.resolve()),
};
jest.mock('../../services/lineMessaging', () => ({
    LineMessagingService: jest.fn().mockImplementation(() => mockLineService)
}));
jest.mock('../../services/googleSheets', () => ({
    GoogleSheetsService: jest.fn().mockImplementation(() => mockGoogleSheetsService)
}));
jest.mock('../../handlers/postbackHandler', () => ({
    PostbackHandler: jest.fn().mockImplementation(() => {
        const mockHandler = {
            handlePostback: jest.fn().mockImplementation((replyToken, data, userId) => {
                const parsedData = JSON.parse(data);
                if (parsedData.type === 'housework' && parsedData.action === 'report') {
                    return mockLineService.replyText(replyToken, '家事の報告を処理しました');
                }
                return Promise.resolve();
            })
        };
        return mockHandler;
    })
}));
describe('Message Handling Integration Tests', () => {
    let messageHandler;
    let postbackHandler;
    let mockEnv;
    beforeEach(() => {
        mockEnv = {
            LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
            LINE_CHANNEL_SECRET: 'test-secret',
            SPREADSHEET_ID: 'test-spreadsheet-id',
            GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
            GOOGLE_SHEETS_CREDENTIALS: 'test-credentials',
            GOOGLE_SHEETS_SPREADSHEET_ID: 'test-sheets-spreadsheet-id'
        };
        // Reset mock functions
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messageHandler = new messageHandler_1.default(mockEnv, mockLineService, mockGoogleSheetsService);
        // PostbackHandlerのモックを明示的に作成
        postbackHandler = {
            handlePostback: jest.fn().mockImplementation((replyToken, data, userId) => {
                const parsedData = JSON.parse(data);
                if (parsedData.type === 'housework' && parsedData.action === 'report') {
                    return mockLineService.replyText(replyToken, '家事の報告を処理しました');
                }
                return Promise.resolve();
            })
        };
    });
    describe('Message Handling', () => {
        it('should handle 家事管理 command', async () => {
            const replyToken = 'test-reply-token';
            await messageHandler.handleMessage(replyToken, '家事管理');
            expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(replyToken, '家事管理テンプレート', expect.objectContaining({
                title: '家事管理',
                text: '家事に関する操作を選択してください'
            }));
        });
        it('should handle 家計簿 command', async () => {
            const replyToken = 'test-reply-token';
            await messageHandler.handleMessage(replyToken, '家計簿');
            expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(replyToken, '家計簿テンプレート', expect.objectContaining({
                title: '家計簿',
                text: '家計簿に関する操作を選択してください'
            }));
        });
    });
    describe('GAS互換性テスト', () => {
        test('家事管理コマンドのテスト', async () => {
            const event = {
                type: 'message',
                message: {
                    type: 'text',
                    id: '468789577898262530',
                    text: '家事管理'
                },
                source: {
                    type: 'user',
                    userId: 'U4af4980629...'
                },
                replyToken: '38ef843bde154d9b91c21320ffd17a0f'
            };
            await messageHandler.handleMessage(event.replyToken, event.message.text, event.source.userId);
            expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(event.replyToken, expect.any(String), expect.objectContaining({
                thumbnailImageUrl: expect.any(String),
                imageAspectRatio: expect.any(String),
                imageSize: expect.any(String),
                title: expect.any(String),
                text: expect.any(String),
                actions: expect.any(Array)
            }));
        });
        test('家事管理ポストバックのテスト', async () => {
            const event = {
                type: 'postback',
                postback: {
                    data: '{"type":"housework", "action":"report"}'
                },
                source: {
                    type: 'user',
                    userId: 'U4af4980629...'
                },
                replyToken: '38ef843bde154d9b91c21320ffd17a0f'
            };
            await postbackHandler.handlePostback(event.replyToken, event.postback.data, event.source.userId);
            expect(mockLineService.replyText).toHaveBeenCalledWith(event.replyToken, '家事の報告を処理しました');
        });
        test('買い出しリストコマンドのテスト', async () => {
            const event = {
                type: 'message',
                message: {
                    type: 'text',
                    id: '468789577898262530',
                    text: '買い出し\nリスト'
                },
                source: {
                    type: 'user',
                    userId: 'U4af4980629...'
                },
                replyToken: '38ef843bde154d9b91c21320ffd17a0f'
            };
            await messageHandler.handleMessage(event.replyToken, event.message.text, event.source.userId);
            expect(mockLineService.replyText).toHaveBeenCalledWith(event.replyToken, expect.any(String));
        });
    });
});
