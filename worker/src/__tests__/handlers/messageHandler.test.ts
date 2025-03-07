import { MessageHandler } from '../../handlers/messageHandler';
import { LineMessagingService } from '../../services/lineMessaging';

jest.mock('../../services/lineMessaging');
jest.mock('../../services/googleSheets');

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      LINE_CHANNEL_SECRET: 'test-secret',
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      GOOGLE_SERVICE_ACCOUNT_KEY: '{}',
      SPREADSHEET_ID: 'test-id'
    };
    messageHandler = new MessageHandler(mockEnv);
  });

  describe('handleMessage', () => {
    it('should handle 家事管理 command', async () => {
      const replyToken = 'test-reply-token';
      const text = '家事管理';

      await messageHandler.handleMessage(replyToken, text);

      expect(LineMessagingService.prototype.replyTemplateButton).toHaveBeenCalledWith(
        replyToken,
        '家事管理テンプレート',
        expect.objectContaining({
          thumbnailImageUrl: expect.any(String),
          imageAspectRatio: 'square',
          imageSize: 'contain',
          title: '家事管理',
          text: expect.any(String),
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'postback',
              label: '報告する'
            }),
            expect.objectContaining({
              type: 'postback',
              label: '確認する'
            })
          ])
        })
      );
    });

    it('should handle 家計簿 command', async () => {
      const replyToken = 'test-reply-token';
      const text = '家計簿';

      await messageHandler.handleMessage(replyToken, text);

      expect(LineMessagingService.prototype.replyTemplateButton).toHaveBeenCalledWith(
        replyToken,
        '家計簿テンプレート',
        expect.objectContaining({
          thumbnailImageUrl: expect.any(String),
          imageAspectRatio: 'square',
          imageSize: 'contain',
          title: '家計簿',
          text: expect.any(String),
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'postback',
              label: '報告する'
            }),
            expect.objectContaining({
              type: 'postback',
              label: '確認する'
            }),
            expect.objectContaining({
              type: 'postback',
              label: '今月の支出'
            })
          ])
        })
      );
    });

    it('should handle unknown command', async () => {
      const replyToken = 'test-reply-token';
      const text = '不明なコマンド';

      await messageHandler.handleMessage(replyToken, text);

      expect(LineMessagingService.prototype.replyText).toHaveBeenCalledWith(
        replyToken,
        'こんにちは！何かお手伝いできることはありますか？'
      );
    });

    it('should handle chat command', async () => {
      const replyToken = 'test-reply-token';
      const text = 'うさこ〜〜〜';
      
      // モックの設定
      const mockChatHandler = {
        handleMessage: jest.fn().mockResolvedValue('どうしたの？何か話したいことある？')
      };
      (messageHandler as any).chatHandler = mockChatHandler;

      await messageHandler.handleMessage(replyToken, text);

      expect(mockChatHandler.handleMessage).toHaveBeenCalledWith(text);
      expect(LineMessagingService.prototype.replyText).toHaveBeenCalledWith(
        replyToken,
        'どうしたの？何か話したいことある？'
      );
    });
  });
}); 