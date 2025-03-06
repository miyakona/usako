const Housework = require('../../classes/housework');

describe('Housework', () => {
  let housework;
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
          const properties = {
            'MAIN_SHEET': 'https://example.com/spreadsheet',
            'IMG_HOUSEWORK': 'https://example.com/image.jpg',
            'FORM_HOUSEWORK': 'https://example.com/form',
            'USER1_ID': 'user1',
            'USER2_ID': 'user2',
            'USER1_NAME': 'ユーザー1',
            'USER2_NAME': 'ユーザー2',
            'GRAPH_HOUSEWORK': 'https://example.com/graph',
          };
          return properties[key] || null;
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

    // Dateをモック化
    const mockDate = new Date('2024-03-15');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    housework = new Housework();
  });

  describe('constructor', () => {
    it('プロパティが正しく設定されること', () => {
      expect(housework.imgUrl).toBe('https://example.com/image.jpg');
      expect(housework.formUrl).toBe('https://example.com/form');
      expect(housework.user1Id).toBe('user1');
      expect(housework.user2Id).toBe('user2');
      expect(housework.user1Name).toBe('ユーザー1');
      expect(housework.user2Name).toBe('ユーザー2');
      expect(housework.graph).toBe('https://example.com/graph');
    });
  });

  describe('getTemplateColumn', () => {
    it('正しいテンプレートを返すこと', () => {
      const result = housework.getTemplateColumn();

      expect(result).toEqual({
        thumbnailImageUrl: 'https://example.com/image.jpg',
        title: '家事管理',
        text: '実施した家事の報告や報告内容の確認ができるよ！\n毎週日曜日に決算するよ♪',
        actions: [{
          type: 'message',
          label: '使ってみる',
          text: '家事管理',
        }],
      });
    });
  });

  describe('getButtonTemplateAction', () => {
    it('正しいボタンテンプレートを返すこと', () => {
      const result = housework.getButtonTemplateAction();

      expect(result).toEqual({
        action: [
          {
            type: 'postback',
            label: '実施家事を報告する',
            data: '{"type":"housework", "action":"report"}',
          },
          {
            type: 'postback',
            label: '報告済家事を確認する',
            data: '{"type":"housework", "action":"confirm"}',
          },
        ],
        image: 'https://example.com/image.jpg',
        imageAspectRatio: 'square',
        imageSize: 'contain',
        title: '家事管理',
        altText: '家事管理テンプレート',
        text: '家事管理だね。\n報告？それとも確認？',
      });
    });
  });

  describe('getMessage', () => {
    it('reportアクションで正しいメッセージを返すこと', () => {
      const result = housework.getMessage('report', 'user1');

      expect(result).toBe('家事報告だね！\nhttps://example.com/form?usp=pp_url&entry.1025033203=2024-03-15');
    });

    it('confirmアクションでgetDoneListを呼び出すこと', () => {
      housework.getDoneList = jest.fn().mockReturnValue('テスト用のリスト');
      const result = housework.getMessage('confirm', 'user1');

      expect(result).toBe('テスト用のリスト');
      expect(housework.getDoneList).toHaveBeenCalledWith('user1');
    });

    it('不正なアクションでエラーメッセージを返すこと', () => {
      const result = housework.getMessage('invalid', 'user1');

      expect(result).toBe('エラー。意図しないアクションが指定されました。');
    });
  });

  describe('getDoneList', () => {
    it('家事が未実施の場合、適切なメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(1);
      const result = housework.getDoneList('user1');

      expect(result).toBe('今日はまだ家事をやってないみたい。\n報告するときは、「フォーム」って話しかけてね！');
    });

    it('実施済みの家事がある場合、リストを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange.mockReturnValue({
        getValues: jest.fn().mockReturnValue([
          ['ユーザー1', '掃除', '2024-03-15', '100', '未'],
          ['ユーザー2', '洗濯', '2024-03-15', '100', '済'],
        ]),
      });

      const result = housework.getDoneList('user1');

      expect(result).toBe('報告済の家事はこれだよ！\n3/15 掃除\n\n報告漏れあったかな？');
    });

    it('実施済みの家事がない場合、未実施メッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange.mockReturnValue({
        getValues: jest.fn().mockReturnValue([
          ['ユーザー1', '掃除', '2024-03-15', '100', '済'],
          ['ユーザー2', '洗濯', '2024-03-15', '100', '済'],
        ]),
      });

      const result = housework.getDoneList('user1');

      expect(result).toBe('今日はまだ家事をやってないみたい。\n報告するときは、「フォーム」って話しかけてね！');
    });
  });

  describe('getter methods', () => {
    it('getSheetが正しく動作すること', () => {
      expect(housework.getSheet()).toBe(mockSheet);
    });

    it('getUser1Nameが正しく動作すること', () => {
      expect(housework.getUser1Name()).toBe('ユーザー1');
    });

    it('getUser2Nameが正しく動作すること', () => {
      expect(housework.getUser2Name()).toBe('ユーザー2');
    });

    it('getGraphが正しく動作すること', () => {
      expect(housework.getGraph()).toBe('https://example.com/graph');
    });
  });
}); 