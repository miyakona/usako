import { MessageHandler } from '../../handlers/messageHandler';
import { LineMessagingService } from '../../services/lineMessaging';
import { GoogleSheetsService } from '../../services/googleSheets';

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
        expect.any(String),
        'square',
        'contain',
        '家事管理',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            type: 'postback',
            label: '家事を報告する'
          }),
          expect.objectContaining({
            type: 'postback',
            label: '家事の状況を確認する'
          })
        ])
      );
    });

    it('should handle 家計簿 command', async () => {
      const replyToken = 'test-reply-token';
      const text = '家計簿';

      await messageHandler.handleMessage(replyToken, text);

      expect(LineMessagingService.prototype.replyTemplateButton).toHaveBeenCalledWith(
        replyToken,
        '家計管理テンプレート',
        expect.any(String),
        'square',
        'contain',
        '家計簿',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            type: 'postback',
            label: '出費を書き込む'
          }),
          expect.objectContaining({
            type: 'postback',
            label: '報告済の支出を確認する'
          })
        ])
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
  });
}); 