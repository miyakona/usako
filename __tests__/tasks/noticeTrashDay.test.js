const NoticeTrashDay = require('../../tasks/noticeTrashDay');
const commandBase = require('../../claasess/commandBase');

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

describe('NoticeTrashDay', () => {
  let noticeTrashDay;
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

    noticeTrashDay = new NoticeTrashDay();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(noticeTrashDay.name).toBe('ゴミの日通知バッチ');
    });
  });

  describe('run', () => {
    it('月曜日の場合は可燃ごみの通知を送信すること', () => {
      // 日曜日（翌日が月曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(2);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は 可燃ごみ のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('第一火曜日の場合は資源再生物の通知を送信すること', () => {
      // 月曜日（翌日が第一火曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(3);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は 資源再生物 のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('第二火曜日の場合は不燃ごみの通知を送信すること', () => {
      // 月曜日（翌日が第二火曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(10);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は 不燃ごみ のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('第三火曜日の場合は資源再生物の通知を送信すること', () => {
      // 月曜日（翌日が第三火曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(17);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は 資源再生物 のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('第四火曜日の場合は不燃ごみの通知を送信すること', () => {
      // 月曜日（翌日が第四火曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(24);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は 不燃ごみ のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('水曜日の場合はプラクルの通知を送信すること', () => {
      // 火曜日（翌日が水曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(4);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は プラクル のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('木曜日の場合は可燃ごみの通知を送信すること', () => {
      // 水曜日（翌日が木曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(5);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '明日は 可燃ごみ のゴミの日だよ！\n準備忘れずに！'
      );
    });

    it('土曜日の場合は通知を送信しないこと', () => {
      // 金曜日（翌日が土曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(7);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).not.toHaveBeenCalled();
    });

    it('日曜日の場合は通知を送信しないこと', () => {
      // 土曜日（翌日が日曜日）
      mockDate.setFullYear(2025);
      mockDate.setMonth(1); // 2月
      mockDate.setDate(8);

      noticeTrashDay.run();

      expect(mockLineMessagingApi.pushAll).not.toHaveBeenCalled();
    });
  });
}); 