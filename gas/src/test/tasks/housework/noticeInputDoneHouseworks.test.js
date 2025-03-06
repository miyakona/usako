const NoticeInputDoneHouseworks = require('../../../tasks/housework/noticeInputDoneHouseworks');
const commandBase = require('../../../claasess/commandBase');

// LineMessagingApiをモック化
global.LineMessagingApi = jest.fn().mockImplementation(() => ({
  pushAll: jest.fn(),
}));

// Loggerをモック化
global.Logger = {
  log: jest.fn(),
};

// commandBaseのmainメソッドをモック化
jest.spyOn(commandBase.prototype, 'main').mockImplementation(function() {
  this.run();
});

describe('NoticeInputDoneHouseworks', () => {
  let noticeInputDoneHouseworks;
  let mockLineMessagingApi;
  let mockDate;

  beforeEach(() => {
    mockLineMessagingApi = {
      pushAll: jest.fn(),
    };

    global.LineMessagingApi.mockImplementation(() => mockLineMessagingApi);

    // Dateをモック化
    mockDate = new Date('2025-02-08'); // 土曜日
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    noticeInputDoneHouseworks = new NoticeInputDoneHouseworks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(noticeInputDoneHouseworks.name).toBe('家事入力警告バッチ');
    });
  });

  describe('run', () => {
    it('第一日曜日の前日の場合はアーカイブの通知を送信すること', () => {
      // 土曜日（翌日が第一日曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(1);

      noticeInputDoneHouseworks.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '2時〜3時の間に今月の家事実績をアーカイブするよ。\n入力は控えてね！'
      );
    });

    it('第一日曜日の前日以外の場合は通知を送信しないこと', () => {
      // 土曜日（翌日が第二日曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(8);

      noticeInputDoneHouseworks.run();

      expect(mockLineMessagingApi.pushAll).not.toHaveBeenCalled();
    });
  });
}); 