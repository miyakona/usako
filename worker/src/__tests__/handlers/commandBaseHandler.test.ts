import { CommandBaseHandler } from '../../handlers/commandBaseHandler';
import { LineMessagingService } from '../../services/lineMessaging';
import { Env } from '../../types';

// テスト用の具体的な実装クラス
class TestCommandHandler extends CommandBaseHandler {
  private commandHandler: (message: string) => Promise<void>;

  constructor(
    env: Env, 
    lineService: LineMessagingService,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    commandHandler?: (message: string) => Promise<void>
  ) {
    super(env, lineService);
    this.commandHandler = commandHandler || this.handleDefaultMessage;
  }

  // runメソッドを追加
  protected async run(): Promise<void> {
    // テスト用の簡単な実装
    console.log('TestCommandHandlerの実行');
    if (this.commandHandler) {
      await this.commandHandler('テストコマンド');
    }
  }

  public async handleMessage(
    replyToken: string, 
    message: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId?: string
  ): Promise<void> {
    try {
      // ヘルプコマンドの処理
      if (message.startsWith('ヘルプ')) {
        const helpCommand = message.replace('ヘルプ', '').trim();
        
        if (helpCommand === '') {
          // 全コマンドのヘルプ
          await this.lineService.replyText(
            replyToken, 
            '以下のコマンドが利用可能です：\n- 家事管理\n- 家計簿\n- 買い出しリスト'
          );
          return;
        } else if (helpCommand === '家事管理') {
          // 特定のコマンドのヘルプ
          await this.lineService.replyText(
            replyToken, 
            '家事管理コマンドの詳細な使い方を説明します。'
          );
          return;
        }
      }

      // 既存のコマンド処理ロジック
      const command = this.parseCommand(message);
      
      switch (command) {
        case '家事管理':
          if (this.commandHandler) {
            await this.commandHandler(message);
          }
          await this.lineService.replyText(replyToken, '家事管理コマンドを処理');
          break;
        case '家計簿':
          await this.lineService.replyText(replyToken, '家計簿コマンドを処理');
          break;
        default:
          await this.handleDefaultMessage(replyToken, message);
      }
    } catch (error) {
      await this.handleError(replyToken, error as Error);
    }
  }

  // エラーハンドリングメソッドを追加
  protected async handleError(replyToken: string, error: Error): Promise<void> {
    console.error('Error in command handler:', error);
    await this.lineService.replyText(
      replyToken, 
      'エラーが発生しました。もう一度お試しください。'
    );
  }

  // デフォルトのメッセージハンドラー
  protected async handleDefaultMessage(replyToken: string, message?: string): Promise<void> {
    console.log(`デフォルトメッセージハンドラー: ${message || ''}`);
    await this.lineService.replyText(
      replyToken, 
      'こんにちは！何かお手伝いできることはありますか？'
    );
  }
}

jest.mock('../../services/lineMessaging');

describe('CommandBaseHandler', () => {
  let mockEnv: Env;
  let mockLineService: jest.Mocked<LineMessagingService>;
  let testHandler: TestCommandHandler;

  beforeEach(() => {
    mockEnv = {
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      LINE_CHANNEL_SECRET: 'test-secret',
      SPREADSHEET_ID: 'test-spreadsheet',
      GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
      GOOGLE_SHEETS_CREDENTIALS: 'test-credentials',
      GOOGLE_SHEETS_SPREADSHEET_ID: 'test-sheets-id',
    };

    const MockLineMessagingService = LineMessagingService as jest.MockedClass<typeof LineMessagingService>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLineService = new MockLineMessagingService(mockEnv as any) as jest.Mocked<LineMessagingService>;
    mockLineService.replyText = jest.fn();
    mockLineService.pushAll = jest.fn();

    testHandler = new TestCommandHandler(mockEnv, mockLineService);
  });

  describe('parseCommand', () => {
    it('should parse 家事管理 command correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseMethod = (testHandler as any).parseCommand;
      expect(parseMethod('家事管理')).toBe('家事管理');
      expect(parseMethod('家事管理 詳細')).toBe('家事管理');
      expect(parseMethod('  家事管理  ')).toBe('家事管理');
    });

    it('should parse 家計簿 command correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseMethod = (testHandler as any).parseCommand;
      expect(parseMethod('家計簿')).toBe('家計簿');
      expect(parseMethod('家計簿 確認')).toBe('家計簿');
      expect(parseMethod('  家計簿  ')).toBe('家計簿');
    });

    it('should parse 買い出しリスト command correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseMethod = (testHandler as any).parseCommand;
      expect(parseMethod('買い出しリスト')).toBe('買い出しリスト');
      expect(parseMethod('買い出し')).toBe('買い出しリスト');
      expect(parseMethod('買い物リスト')).toBe('買い出しリスト');
      expect(parseMethod('  買い出し  ')).toBe('買い出しリスト');
    });

    it('should return default for unknown commands', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseMethod = (testHandler as any).parseCommand;
      expect(parseMethod('不明なコマンド')).toBe('default');
      expect(parseMethod('')).toBe('default');
    });
  });

  describe('handleMessage', () => {
    it('should handle 家事管理 command', async () => {
      const replyToken = 'test-reply-token';
      await testHandler.handleMessage(replyToken, '家事管理');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken, 
        '家事管理コマンドを処理'
      );
    });

    it('should handle 家計簿 command', async () => {
      const replyToken = 'test-reply-token';
      await testHandler.handleMessage(replyToken, '家計簿');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken, 
        '家計簿コマンドを処理'
      );
    });

    it('should handle default command', async () => {
      const replyToken = 'test-reply-token';
      await testHandler.handleMessage(replyToken, '不明なコマンド');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken, 
        'こんにちは！何かお手伝いできることはありますか？'
      );
    });
  });

  describe('help generation', () => {
    it('should generate help text for a single command', () => {
      const helpMethod = (testHandler as any).generateHelp;
      const helpText = helpMethod('家事管理');
      
      expect(helpText).toContain('家事管理');
      expect(helpText).toMatch(/家事管理に関するヘルプ/);
    });

    it('should generate help text for multiple commands', () => {
      const helpMethod = (testHandler as any).generateHelp;
      const helpText = helpMethod(['家事管理', '家計簿', '買い出しリスト']);
      
      expect(helpText).toContain('家事管理');
      expect(helpText).toContain('家計簿');
      expect(helpText).toContain('買い出しリスト');
      expect(helpText).toMatch(/以下のコマンドが利用可能です/);
    });

    it('should handle help request command', async () => {
      const replyToken = 'test-help-token';
      await testHandler.handleMessage(replyToken, 'ヘルプ');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken,
        expect.stringContaining('以下のコマンドが利用可能です')
      );
    });

    it('should provide detailed help for specific command', async () => {
      const replyToken = 'test-detailed-help-token';
      await testHandler.handleMessage(replyToken, 'ヘルプ 家事管理');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken,
        expect.stringContaining('家事管理コマンドの詳細な使い方')
      );
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const replyToken = 'test-reply-token';
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const errorTestHandler = new TestCommandHandler(
        mockEnv, 
        mockLineService, 
        errorHandler
      );

      await errorTestHandler.handleMessage(replyToken, '家事管理');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken, 
        'エラーが発生しました。もう一度お試しください。'
      );
    });

    it('should log error details', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const replyToken = 'test-reply-token';
      const testError = new Error('Test specific error');
      
      const errorHandler = jest.fn().mockImplementation(() => {
        throw testError;
      });
      
      const errorTestHandler = new TestCommandHandler(
        mockEnv, 
        mockLineService, 
        errorHandler
      );

      await errorTestHandler.handleMessage(replyToken, '家事管理');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in command handler:', 
        testError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('main method', () => {
    it('should call run method and log end message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const runSpy = jest.spyOn(testHandler as any, 'run');

      await testHandler.main();

      expect(runSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('end TestCommandHandler');

      consoleSpy.mockRestore();
      runSpy.mockRestore();
    });

    it('should call notice method when run method throws an error', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Test error'));
      const errorTestHandler = new TestCommandHandler(
        mockEnv, 
        mockLineService, 
        errorHandler
      );

      const noticeSpy = jest.spyOn(errorTestHandler as any, 'notice');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await errorTestHandler.main();

      expect(noticeSpy).toHaveBeenCalledWith('Test error', expect.any(String));
      expect(consoleSpy).toHaveBeenCalled();

      noticeSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
}); 