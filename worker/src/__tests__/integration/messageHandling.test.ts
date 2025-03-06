import { MessageHandler } from '../../handlers/messageHandler';
import { PostbackHandler } from '../../handlers/postbackHandler';
import { LineMessagingService } from '../../services/lineMessaging';
import { GoogleSheetsService } from '../../services/googleSheets';
import { Env } from '../../types';

const mockLineService = {
  replyTemplateButton: jest.fn(),
  replyText: jest.fn(),
  pushMessage: jest.fn()
};

jest.mock('../../services/lineMessaging', () => ({
  LineMessagingService: jest.fn().mockImplementation(() => mockLineService)
}));

jest.mock('../../services/googleSheets');

describe('Message Handling Integration Tests', () => {
  let messageHandler: MessageHandler;
  let postbackHandler: PostbackHandler;
  let mockEnv: Env;

  beforeEach(() => {
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

    // Reset mock functions
    mockLineService.replyTemplateButton.mockClear();
    mockLineService.replyText.mockClear();
    mockLineService.pushMessage.mockClear();

    messageHandler = new MessageHandler(mockEnv);
    postbackHandler = new PostbackHandler(mockEnv);
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

      await messageHandler.handleMessage(
        event.replyToken,
        event.message.text,
        event.source.userId
      );

      expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(
        event.replyToken,
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Array)
      );
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

      await postbackHandler.handlePostback(
        event.replyToken,
        event.postback.data,
        event.source.userId
      );

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        event.replyToken,
        expect.stringContaining('家事の報告')
      );
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

      await messageHandler.handleMessage(
        event.replyToken,
        event.message.text,
        event.source.userId
      );

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        event.replyToken,
        expect.stringContaining('買い出しリスト')
      );
    });
  });
}); 