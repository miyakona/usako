const RemindInputDoneHouseworks = require('../../../tasks/housework/remindInputDoneHouseworks');
const commandBase = require('../../../classes/commandBase');

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

describe('RemindInputDoneHouseworks', () => {
  let remindInputDoneHouseworks;
  let mockLineMessagingApi;

  beforeEach(() => {
    mockLineMessagingApi = {
      pushAll: jest.fn(),
    };

    global.LineMessagingApi.mockImplementation(() => mockLineMessagingApi);

    remindInputDoneHouseworks = new RemindInputDoneHouseworks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(remindInputDoneHouseworks.name).toBe('実施済家事入力のリマインドバッチ');
    });
  });

  describe('run', () => {
    it('実施済家事入力のリマインドメッセージを送信すること', () => {
      remindInputDoneHouseworks.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '今週もおつかれさま！\n家事の報告は今日の12時までに済ませてね。\n遅れると、1時からの集計に間に合わないよ！'
      );
    });
  });
}); 