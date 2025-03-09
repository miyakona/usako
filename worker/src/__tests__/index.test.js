"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messageHandler_1 = __importDefault(require("../handlers/messageHandler"));
const postbackHandler_1 = require("../handlers/postbackHandler");
const index_1 = __importDefault(require("../index"));
// モックの設定
jest.mock('../handlers/messageHandler');
jest.mock('../handlers/postbackHandler');
// crypto.subtleのモック
const mockSign = jest.fn();
const mockImportKey = jest.fn();
Object.defineProperty(global, 'crypto', {
    value: {
        subtle: {
            importKey: mockImportKey,
            sign: mockSign
        },
        getRandomValues: jest.fn()
    }
});
describe('Worker Handler', () => {
    let mockEnv;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let mockRequest;
    let mockExecutionContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageHandlerInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let postbackHandlerInstance;
    beforeEach(() => {
        // モックのリセット
        jest.clearAllMocks();
        // 環境変数のモック
        mockEnv = {
            LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
            LINE_CHANNEL_SECRET: 'test-secret',
            SPREADSHEET_ID: 'test-spreadsheet-id',
            GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
            GOOGLE_SHEETS_CREDENTIALS: 'test-credentials',
            GOOGLE_SHEETS_SPREADSHEET_ID: 'test-sheets-spreadsheet-id'
        };
        // ExecutionContextのモック
        mockExecutionContext = {
            env: mockEnv,
            waitUntil: jest.fn(),
            passThroughOnException: jest.fn()
        };
        // crypto.subtleのモックの設定
        mockImportKey.mockResolvedValue('mockCryptoKey');
        mockSign.mockResolvedValue(new Uint8Array([0x12, 0x34]).buffer);
        // MessageHandlerとPostbackHandlerのモック実装
        messageHandlerInstance = {
            handleMessage: jest.fn().mockResolvedValue(undefined)
        };
        postbackHandlerInstance = {
            handlePostback: jest.fn().mockResolvedValue(undefined)
        };
        messageHandler_1.default.mockImplementation((env, lineService) => messageHandlerInstance);
        postbackHandler_1.PostbackHandler.mockImplementation(() => postbackHandlerInstance);
        // モックリクエストの作成
        mockRequest = new Request('https://example.com', {
            method: 'POST',
            headers: {
                'X-Line-Signature': '1234'
            },
            body: JSON.stringify({
                events: [
                    {
                        type: 'message',
                        message: {
                            type: 'text',
                            text: 'こんにちは'
                        },
                        replyToken: 'test-reply-token',
                        source: {
                            type: 'user',
                            userId: 'test-user-id'
                        }
                    }
                ]
            })
        });
    });
    test('OPTIONSリクエストに対してCORSヘッダーを返す', async () => {
        // OPTIONSリクエストの作成
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mockRequest = new Request('https://example.com', {
            method: 'OPTIONS'
        });
        const response = await index_1.default.fetch(mockRequest, mockEnv, mockExecutionContext);
        expect(response.status).toBe(200);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
        expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, X-Line-Signature');
    });
    test('POSTリクエスト以外は404を返す', async () => {
        // GETリクエストの作成
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mockRequest = new Request('https://example.com', {
            method: 'GET'
        });
        const response = await index_1.default.fetch(mockRequest, mockEnv, mockExecutionContext);
        expect(response.status).toBe(404);
    });
    test('署名がない場合は401を返す', async () => {
        // 署名のないPOSTリクエストの作成
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mockRequest = new Request('https://example.com', {
            method: 'POST',
            body: JSON.stringify({ events: [] })
        });
        const response = await index_1.default.fetch(mockRequest, mockEnv, mockExecutionContext);
        expect(response.status).toBe(401);
        const text = await response.text();
        expect(text).toBe('Signature Required');
    });
    test('有効なPOSTリクエストを処理する', async () => {
        const response = await index_1.default.fetch(mockRequest, mockEnv, mockExecutionContext);
        expect(response.status).toBe(200);
        const text = await response.text();
        expect(text).toBe('OK');
        // MessageHandlerが正しく初期化されたことを確認
        expect(messageHandler_1.default).toHaveBeenCalledWith(mockEnv);
        // handleMessageが呼び出されたことを確認
        expect(messageHandlerInstance.handleMessage).toHaveBeenCalledWith('test-reply-token', 'こんにちは', 'test-user-id');
    });
    describe('workerHandler', () => {
        it('should handle message events', async () => {
            // メッセージイベントのテストケースを修正
            const mockLineEvent = {
                type: 'message',
                replyToken: 'test-reply-token',
                message: {
                    type: 'text',
                    text: 'テストメッセージ'
                },
                source: {
                    type: 'user',
                    userId: 'test-user-id'
                }
            };
            const mockRequest = new Request('https://example.com', {
                method: 'POST',
                headers: {
                    'X-Line-Signature': '1234'
                },
                body: JSON.stringify({
                    events: [mockLineEvent]
                })
            });
            const response = await index_1.default.fetch(mockRequest, mockEnv, mockExecutionContext);
            expect(messageHandlerInstance.handleMessage).toHaveBeenCalledWith(mockLineEvent.replyToken, mockLineEvent.message.text, mockLineEvent.source.userId);
        });
        it('should handle postback events', async () => {
            // ポストバックイベントのテストケースを修正
            const mockPostbackEvent = {
                type: 'postback',
                replyToken: 'test-reply-token',
                postback: {
                    data: 'テストポストバック'
                },
                source: {
                    type: 'user',
                    userId: 'test-user-id'
                }
            };
            const mockPostbackRequest = new Request('https://example.com', {
                method: 'POST',
                headers: {
                    'X-Line-Signature': '1234'
                },
                body: JSON.stringify({
                    events: [mockPostbackEvent]
                })
            });
            const postbackResponse = await index_1.default.fetch(mockPostbackRequest, mockEnv, mockExecutionContext);
            expect(postbackHandlerInstance.handlePostback).toHaveBeenCalledWith(mockPostbackEvent.replyToken, mockPostbackEvent.postback.data, mockPostbackEvent.source.userId);
        });
    });
});
