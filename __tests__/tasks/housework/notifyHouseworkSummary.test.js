const NotifyHouseworkSummary = require('../../../tasks/housework/notifyHouseworkSummary');
const commandBase = require('../../../claasess/commandBase');

// Houseworkをモック化
global.Housework = jest.fn().mockImplementation(() => ({
  getSheet: jest.fn(),
  getUser1Name: jest.fn(),
  getUser2Name: jest.fn(),
  getGraph: jest.fn(),
}));

// LineMessagingApiをモック化
global.LineMessagingApi = jest.fn().mockImplementation(() => ({
  pushAll: jest.fn(),
}));

// SpreadsheetAppをモック化
global.SpreadsheetApp = {
  openByUrl: jest.fn().mockReturnValue({
    getSheetByName: jest.fn(),
  }),
};

// PropertiesServiceをモック化
global.PropertiesService = {
  getScriptProperties: jest.fn().mockReturnValue({
    getProperty: jest.fn().mockReturnValue('https://example.com/spreadsheet'),
  }),
};

// Loggerをモック化
global.Logger = {
  log: jest.fn(),
};

// commandBaseのmainメソッドをモック化
jest.spyOn(commandBase.prototype, 'main').mockImplementation(function() {
  this.run();
});

describe('NotifyHouseworkSummary', () => {
  let notifyHouseworkSummary;
  let mockHousework;
  let mockLineMessagingApi;
  let mockSheet;
  let mockDate;

  beforeEach(() => {
    mockSheet = {
      getRange: jest.fn().mockReturnValue({
        getValues: jest.fn(),
        setValue: jest.fn(),
      }),
      getLastRow: jest.fn().mockReturnValue(5),
    };

    mockHousework = {
      getSheet: jest.fn().mockReturnValue(mockSheet),
      getUser1Name: jest.fn().mockReturnValue('ユーザー1'),
      getUser2Name: jest.fn().mockReturnValue('ユーザー2'),
      getGraph: jest.fn().mockReturnValue('https://example.com/graph'),
    };

    mockLineMessagingApi = {
      pushAll: jest.fn(),
    };

    global.Housework.mockImplementation(() => mockHousework);
    global.LineMessagingApi.mockImplementation(() => mockLineMessagingApi);

    // Dateをモック化
    mockDate = new Date('2025-02-09'); // 日曜日
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    notifyHouseworkSummary = new NotifyHouseworkSummary();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(notifyHouseworkSummary.name).toBe('実施家事のサマリ通知バッチ');
    });
  });

  describe('run', () => {
    it('未通知の家事がある場合はサマリを実行すること', () => {
      // 未通知の家事データを設定
      mockSheet.getRange().getValues.mockReturnValue([
        ['ユーザー1', '掃除', '2025/02/01', '10:00', '済'],
        ['ユーザー1', '洗濯', '2025/02/02', '11:00', ''],
        ['ユーザー2', '料理', '2025/02/03', '12:00', ''],
        ['ユーザー2', '買い物', '2025/02/04', '13:00', '済'],
      ]);

      notifyHouseworkSummary.run();

      expect(mockHousework.getSheet).toHaveBeenCalled();
      expect(mockHousework.getUser1Name).toHaveBeenCalled();
      expect(mockHousework.getUser2Name).toHaveBeenCalled();
      expect(mockHousework.getGraph).toHaveBeenCalled();
      expect(mockLineMessagingApi.pushAll).toHaveBeenCalled();
      expect(mockSheet.getRange().setValue).toHaveBeenCalledWith('済');
    });

    it('未通知の家事がない場合はサマリを実行しないこと', () => {
      // すべて通知済みの家事データを設定
      mockSheet.getRange().getValues.mockReturnValue([
        ['ユーザー1', '掃除', '2025/02/01', '10:00', '済'],
        ['ユーザー1', '洗濯', '2025/02/02', '11:00', '済'],
        ['ユーザー2', '料理', '2025/02/03', '12:00', '済'],
        ['ユーザー2', '買い物', '2025/02/04', '13:00', '済'],
      ]);

      notifyHouseworkSummary.run();

      expect(mockHousework.getSheet).toHaveBeenCalled();
      expect(mockHousework.getUser1Name).not.toHaveBeenCalled();
      expect(mockHousework.getUser2Name).not.toHaveBeenCalled();
      expect(mockHousework.getGraph).not.toHaveBeenCalled();
      expect(mockLineMessagingApi.pushAll).not.toHaveBeenCalled();
      expect(mockSheet.getRange().setValue).not.toHaveBeenCalled();
    });
  });

  describe('getUnnotified', () => {
    it('未通知の家事を正しく取得すること', () => {
      const reported = [
        ['ユーザー1', '掃除', '2025/02/01', '10:00', '済'],
        ['ユーザー1', '洗濯', '2025/02/02', '11:00', ''],
        ['ユーザー2', '料理', '2025/02/03', '12:00', ''],
        ['ユーザー2', '買い物', '2025/02/04', '13:00', '済'],
      ];

      const result = notifyHouseworkSummary.getUnnotified('ユーザー1', reported);

      expect(result).toEqual({
        user1: ['洗濯'],
        user2: ['料理'],
      });
    });
  });

  describe('getSummary', () => {
    it('家事のサマリを正しく取得すること', () => {
      const user = 'ユーザー1';
      const context = ['掃除', '掃除', '洗濯'];

      const result = notifyHouseworkSummary.getSummary(user, context);

      expect(result).toHaveProperty('sumMoney');
      expect(result).toHaveProperty('didCount');
      expect(result.didCount).toEqual({
        '掃除': 2,
        '洗濯': 1,
      });
    });
  });

  describe('getSpendingMoney', () => {
    it('支払金を正しく取得すること', () => {
      const mockReferringSheet = {
        getRange: jest.fn().mockReturnValue({
          getValues: jest.fn().mockReturnValue([
            ['掃除', '100', '200'],
            ['洗濯', '300', '400'],
          ]),
          getValue: jest.fn().mockReturnValue('100'),
        }),
        getLastRow: jest.fn().mockReturnValue(3),
      };

      global.SpreadsheetApp.openByUrl().getSheetByName.mockReturnValue(mockReferringSheet);

      const result = notifyHouseworkSummary.getSpendingMoney('ユーザー1', '掃除');

      expect(result).toBe('100');
    });
  });

  describe('getFormattedMessage', () => {
    it('メッセージを正しく生成すること', () => {
      const user1 = 'ユーザー1';
      const user2 = 'ユーザー2';
      const summary = {
        user1: {
          sumMoney: 1000,
          didCount: {
            '掃除': 2,
            '洗濯': 1,
          },
        },
        user2: {
          sumMoney: 2000,
          didCount: {
            '料理': 3,
            '買い物': 1,
          },
        },
      };
      const graph = 'https://example.com/graph';

      const message = notifyHouseworkSummary.getFormattedMessage(user1, user2, summary, graph);

      expect(message).toContain('今週の家事実績報告！');
      expect(message).toContain('ユーザー1に 1000円');
      expect(message).toContain('ユーザー2に 2000円');
      expect(message).toContain('掃除 2回');
      expect(message).toContain('洗濯 1回');
      expect(message).toContain('料理 3回');
      expect(message).toContain('買い物 1回');
      expect(message).toContain(graph);
    });
  });
}); 