import { Env, LineWebhookRequest } from '../types';
import workerHandler from '../index';
import { MessageHandler } from '../handlers/messageHandler';
import { PostbackHandler } from '../handlers/postbackHandler';

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
  let mockEnv: Env;
  let mockRequest: Request;
  let mockExecutionContext: ExecutionContext;
  let messageHandlerInstance: any;
  let postbackHandlerInstance: any;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // 環境変数のモック
    mockEnv = {
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      LINE_CHANNEL_SECRET: 'test-secret',
      GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key: 'test-private-key',
        client_email: 'test@example.com'
      }),
      SPREADSHEET_ID: 'test-spreadsheet-id'
    };

    // ExecutionContextのモック
    mockExecutionContext = {
      waitUntil: jest.fn(),
      passThroughOnException: jest.fn()
    } as unknown as ExecutionContext;

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
    (MessageHandler as jest.Mock).mockImplementation(() => messageHandlerInstance);
    (PostbackHandler as jest.Mock).mockImplementation(() => postbackHandlerInstance);
  });

  test('OPTIONSリクエストに対してCORSヘッダーを返す', async () => {
    // OPTIONSリクエストの作成
    mockRequest = new Request('https://example.com', {
      method: 'OPTIONS'
    });

    const response = await workerHandler.fetch(mockRequest, mockEnv, mockExecutionContext);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, X-Line-Signature');
  });

  test('POSTリクエスト以外は404を返す', async () => {
    // GETリクエストの作成
    mockRequest = new Request('https://example.com', {
      method: 'GET'
    });

    const response = await workerHandler.fetch(mockRequest, mockEnv, mockExecutionContext);
    
    expect(response.status).toBe(404);
  });

  test('署名がない場合は401を返す', async () => {
    // 署名のないPOSTリクエストの作成
    mockRequest = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ events: [] })
    });

    const response = await workerHandler.fetch(mockRequest, mockEnv, mockExecutionContext);
    
    expect(response.status).toBe(401);
    const text = await response.text();
    expect(text).toBe('Signature Required');
  });

  test('有効なPOSTリクエストを処理する', async () => {
    // テスト用のWebhookリクエスト
    const webhookRequest: LineWebhookRequest = {
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
    };

    // 有効な署名付きPOSTリクエストの作成
    mockRequest = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Line-Signature': '1234'
      },
      body: JSON.stringify(webhookRequest)
    });

    // ReadableStreamのモック
    const mockReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify(webhookRequest)));
        controller.close();
      }
    });

    // text()メソッドのモック
    mockRequest.text = jest.fn().mockResolvedValue(JSON.stringify(webhookRequest));
    
    const response = await workerHandler.fetch(mockRequest, mockEnv, mockExecutionContext);
    
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('OK');

    // MessageHandlerが正しく初期化されたことを確認
    expect(MessageHandler).toHaveBeenCalledWith(mockEnv);
    
    // handleMessageが呼び出されたことを確認
    expect(messageHandlerInstance.handleMessage).toHaveBeenCalledWith(
      'test-reply-token',
      'こんにちは',
      'test-user-id'
    );
  });
}); 