const LineMessagingApi = require('../../classes/lineMessagingApi');

describe('LineMessagingApi', () => {
  let lineMessagingApi;
  let mockProperties;
  let mockUrlFetchApp;

  beforeEach(() => {
    // モックの設定
    mockProperties = {
      getScriptProperties: jest.fn().mockReturnValue({
        getProperty: jest.fn().mockImplementation((key) => {
          const properties = {
            'CHANNEL_ACCESS_TOKEN': 'test-token',
            'USER1_ID': 'user1',
            'USER2_ID': 'user2',
          };
          return properties[key] || null;
        }),
      }),
    };

    mockUrlFetchApp = {
      fetch: jest.fn(),
    };

    global.PropertiesService = mockProperties;
    global.UrlFetchApp = mockUrlFetchApp;
    global.Logger = {
      log: jest.fn(),
    };

    lineMessagingApi = new LineMessagingApi();
  });

  describe('constructor', () => {
    it('チャンネルアクセストークンが正しく設定されること', () => {
      expect(lineMessagingApi.channelAccessToken).toBe('test-token');
    });
  });

  describe('pushAll', () => {
    it('両方のユーザーにメッセージを送信すること', () => {
      const message = 'テストメッセージ';
      lineMessagingApi.pushAll(message);

      expect(mockUrlFetchApp.fetch).toHaveBeenCalledTimes(2);
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        expect.objectContaining({
          payload: JSON.stringify({
            to: 'user1',
            messages: [{ type: 'text', text: message }],
          }),
        })
      );
      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        expect.objectContaining({
          payload: JSON.stringify({
            to: 'user2',
            messages: [{ type: 'text', text: message }],
          }),
        })
      );
    });
  });

  describe('replyText', () => {
    it('正しい形式でテキストメッセージを返信すること', () => {
      const replyToken = 'test-reply-token';
      const text = 'テストメッセージ';
      lineMessagingApi.replyText(replyToken, text);

      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/reply',
        expect.objectContaining({
          payload: JSON.stringify({
            replyToken,
            messages: [{ type: 'text', text: String(text) }],
          }),
        })
      );
    });
  });

  describe('replyTemplateButton', () => {
    it('正しい形式でボタンテンプレートメッセージを返信すること', () => {
      const replyToken = 'test-reply-token';
      const altText = 'テスト代替テキスト';
      const thumbnailImageUrl = 'https://example.com/image.jpg';
      const imageAspectRatio = 'square';
      const imageSize = 'contain';
      const title = 'テストタイトル';
      const text = 'テストメッセージ';
      const actions = [{ type: 'message', label: 'テスト', text: 'テスト' }];

      lineMessagingApi.replyTemplateButton(
        replyToken,
        altText,
        thumbnailImageUrl,
        imageAspectRatio,
        imageSize,
        title,
        text,
        actions
      );

      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/reply',
        expect.objectContaining({
          payload: JSON.stringify({
            replyToken,
            messages: [{
              type: 'template',
              altText,
              template: {
                type: 'buttons',
                thumbnailImageUrl,
                imageAspectRatio,
                imageSize,
                title,
                text,
                actions,
              },
            }],
          }),
        })
      );
    });
  });

  describe('replyTemplateCarousel', () => {
    it('正しい形式でカルーセルテンプレートメッセージを返信すること', () => {
      const replyToken = 'test-reply-token';
      const columns = [{
        thumbnailImageUrl: 'https://example.com/image1.jpg',
        title: 'テスト1',
        text: 'テストメッセージ1',
        actions: [{ type: 'message', label: 'テスト1', text: 'テスト1' }],
      }];

      lineMessagingApi.replyTemplateCarousel(replyToken, columns);

      expect(mockUrlFetchApp.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/reply',
        expect.objectContaining({
          payload: JSON.stringify({
            replyToken,
            messages: [{
              type: 'template',
              altText: '機能一覧の表示',
              template: {
                type: 'carousel',
                columns,
                imageAspectRatio: 'square',
                imageSize: 'contain',
              },
            }],
          }),
        })
      );
    });
  });

  describe('getOptions', () => {
    it('正しいオプションを返すこと', () => {
      const postData = { test: 'data' };
      const options = lineMessagingApi.getOptions(postData);

      expect(options).toEqual({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        payload: JSON.stringify(postData),
        muteHttpExceptions: true,
      });
    });
  });
}); 