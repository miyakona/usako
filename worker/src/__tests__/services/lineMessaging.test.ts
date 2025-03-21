import { LineMessagingService } from '../../services/lineMessaging';
import { Env } from '../../types';

describe('LineMessagingService', () => {
  let lineService: LineMessagingService;
  let mockEnv: Env;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockEnv = {
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      LINE_CHANNEL_SECRET: 'test-secret',
      GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
      SPREADSHEET_ID: 'test-spreadsheet-id',
      GOOGLE_SHEETS_CREDENTIALS: 'test-credentials',
      GOOGLE_SHEETS_SPREADSHEET_ID: 'test-sheets-spreadsheet-id'
    };

    lineService = new LineMessagingService(mockEnv);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('replyText', () => {
    it('should send text message reply', async () => {
      const replyToken = 'test-reply-token';
      const text = 'テストメッセージ';

      mockFetch.mockResolvedValueOnce({ ok: true });

      await lineService.replyText(replyToken, text);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/reply',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockEnv.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [{
              type: 'text',
              text: text
            }]
          })
        }
      );
    });

    it('should throw error when API call fails', async () => {
      const replyToken = 'test-reply-token';
      const text = 'テストメッセージ';

      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

      await expect(lineService.replyText(replyToken, text))
        .rejects
        .toThrow('Failed to send message');
    });
  });

  describe('replyTemplateButton', () => {
    it('should send button template message', async () => {
      const replyToken = 'test-reply-token';
      const altText = 'テストボタン';
      const options = {
        thumbnailImageUrl: 'https://example.com/image.jpg',
        imageAspectRatio: 'square' as 'square' | 'rectangle',
        imageSize: 'contain' as 'contain' | 'cover',
        title: 'テストタイトル',
        text: 'テストテキスト',
        actions: [
          {
            type: 'postback',
            label: 'アクション1',
            data: 'action1'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({ ok: true });

      await lineService.replyTemplateButton(
        replyToken,
        altText,
        options
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/reply',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }),
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [
              {
                type: 'template',
                altText: altText,
                template: {
                  type: 'buttons',
                  thumbnailImageUrl: options.thumbnailImageUrl,
                  imageAspectRatio: options.imageAspectRatio,
                  imageSize: options.imageSize,
                  title: options.title,
                  text: options.text,
                  actions: options.actions
                }
              }
            ]
          })
        })
      );
    });
  });

  describe('replyTemplateCarousel', () => {
    it('should send carousel template message', async () => {
      const replyToken = 'test-reply-token';
      const columns = [
        {
          thumbnailImageUrl: 'https://example.com/image1.jpg',
          title: 'タイトル1',
          text: 'テキスト1',
          actions: [{
            type: 'message',
            label: 'アクション1',
            text: 'アクション1'
          }]
        }
      ];

      mockFetch.mockResolvedValueOnce({ ok: true });

      await lineService.replyTemplateCarousel(replyToken, columns);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/reply',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockEnv.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [{
              type: 'template',
              altText: 'カルーセルテンプレート',
              template: {
                type: 'carousel',
                columns: columns
              }
            }]
          })
        }
      );
    });
  });

  describe('push', () => {
    it('should send push message', async () => {
      const userId = 'test-user-id';
      const text = 'テストメッセージ';

      mockFetch.mockResolvedValueOnce({ ok: true });

      await lineService.push(text, userId);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockEnv.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            to: userId,
            messages: [{
              type: 'text',
              text: text
            }]
          })
        }
      );
    });
  });
}); 