const CommandBase = require('../../claasess/commandBase');

// LineMessagingApiのモック
class MockLineMessagingApi {
  pushAll(message) {
    this.lastMessage = message;
  }
}

describe('CommandBase', () => {
  let commandBase;
  let mockLineMessagingApi;

  beforeEach(() => {
    // LineMessagingApiのモックを設定
    mockLineMessagingApi = new MockLineMessagingApi();
    global.LineMessagingApi = jest.fn().mockImplementation(() => mockLineMessagingApi);
    global.Logger = {
      log: jest.fn(),
    };

    commandBase = new CommandBase('テストコマンド');
  });

  describe('constructor', () => {
    it('名前が正しく設定されること', () => {
      expect(commandBase.name).toBe('テストコマンド');
    });
  });

  describe('main', () => {
    it('正常に実行されること', () => {
      commandBase.run = jest.fn();
      commandBase.main();

      expect(commandBase.run).toHaveBeenCalled();
      expect(global.Logger.log).toHaveBeenCalledWith('end テストコマンド');
    });

    it('エラー時にnoticeが呼ばれること', () => {
      const error = new Error('テストエラー');
      error.stack = 'スタックトレース';
      commandBase.run = jest.fn().mockImplementation(() => {
        throw error;
      });

      commandBase.notice = jest.fn();
      commandBase.main();

      expect(commandBase.notice).toHaveBeenCalledWith('テストエラー', 'スタックトレース');
      expect(global.Logger.log).toHaveBeenCalledWith('end テストコマンド');
    });
  });

  describe('notice', () => {
    it('エラーメッセージが正しく送信されること', () => {
      const errorMessage = 'テストエラー';
      const stack = 'スタックトレース';

      commandBase.notice(errorMessage, stack);

      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('テストコマンド の実行に失敗しました'));
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('error message: テストエラー'));
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('stack trace:'));
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('スタックトレース'));

      expect(mockLineMessagingApi.lastMessage).toContain('テストコマンド の実行に失敗しました');
      expect(mockLineMessagingApi.lastMessage).toContain('error message: テストエラー');
      expect(mockLineMessagingApi.lastMessage).toContain('stack trace:');
      expect(mockLineMessagingApi.lastMessage).toContain('スタックトレース');
    });
  });
}); 