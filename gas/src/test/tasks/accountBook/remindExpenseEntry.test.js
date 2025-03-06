const RemindExpenseEntry = require('../../../tasks/accountBook/remindExpenseEntry');
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

describe('RemindExpenseEntry', () => {
  let remindExpenseEntry;
  let mockLineMessagingApi;

  beforeEach(() => {
    mockLineMessagingApi = {
      pushAll: jest.fn(),
    };

    global.LineMessagingApi.mockImplementation(() => mockLineMessagingApi);

    remindExpenseEntry = new RemindExpenseEntry();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(remindExpenseEntry.name).toBe('出費入力のリマインドバッチ');
    });
  });

  describe('run', () => {
    it('出費入力のリマインドメッセージを送信すること', () => {
      remindExpenseEntry.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledWith(
        '今月もおつかれさま！\n出費の報告は26日の18時までに済ませてね。遅れる場合は、翌月の出費として報告してね！\n支払い額の通知、出費全体の通知は26日の19時頃にくるよ！'
      );
    });
  });
}); 