const Chat = require('../../classes/chat');

jest.mock('../../classes/commandBase');

describe('Chat', () => {
  let chat;
  let mockSheet;
  let mockProperties;

  beforeEach(() => {
    // モックの設定
    mockSheet = {
      getRange: jest.fn(),
      getLastRow: jest.fn().mockReturnValue(3),
    };

    mockProperties = {
      getScriptProperties: jest.fn().mockReturnValue({
        getProperty: jest.fn().mockImplementation((key) => {
          if (key === 'MAIN_SHEET') return 'https://example.com/spreadsheet';
          if (key === 'IMG_CHAT') return 'https://example.com/image.jpg';
          return null;
        }),
      }),
    };

    global.SpreadsheetApp = {
      openByUrl: jest.fn().mockReturnValue({
        getSheetByName: jest.fn().mockReturnValue(mockSheet),
      }),
    };

    global.PropertiesService = mockProperties;
    global.Logger = {
      log: jest.fn(),
    };

    // Utilitiesオブジェクトをモック化
    global.Utilities = {
      getUuid: jest.fn().mockReturnValue('12345678-1234-1234-1234-123456789abc'),
    };

    chat = new Chat();
  });

  describe('getTemplateColumn', () => {
    it('正しいテンプレートを返すこと', () => {
      const result = chat.getTemplateColumn();

      expect(result).toEqual({
        thumbnailImageUrl: 'https://example.com/image.jpg',
        title: 'うさことおしゃべり',
        text: '登録された言葉以外で話しかけると、私とおしゃべりできるよ♪',
        actions: [{
          type: 'message',
          label: 'おしゃべり！',
          text: 'うさこ〜〜〜',
        }],
      });
    });
  });

  describe('getMessage', () => {
    it('スプレッドシートからランダムにメッセージを取得すること', () => {
      const mockMessages = [
        ['こんにちは'],
        ['さようなら'],
        ['おはよう'],
      ];

      mockSheet.getRange.mockReturnValue({
        getValues: jest.fn().mockReturnValue(mockMessages),
      });

      const result = chat.getMessage();

      expect(result).toEqual(['こんにちは']);
      expect(mockSheet.getRange).toHaveBeenCalledWith(1, 1, 3, 1);
    });
  });
}); 