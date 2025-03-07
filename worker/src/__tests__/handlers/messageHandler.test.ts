import { MessageHandler } from '../../handlers/messageHandler';
import { LineMessagingService } from '../../services/lineMessaging';
import { GoogleSheetsService } from '../../services/googleSheets';
import { Env } from '../../types';

jest.mock('../../services/lineMessaging');
jest.mock('../../services/googleSheets');
jest.mock('../../handlers/purchaseHandler');
jest.mock('../../handlers/chatHandler');

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockLineService: jest.Mocked<LineMessagingService>;
  let mockGoogleSheetsService: jest.Mocked<GoogleSheetsService>;
  let mockEnv: Env;

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
    const MockGoogleSheetsService = GoogleSheetsService as jest.MockedClass<typeof GoogleSheetsService>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLineService = new MockLineMessagingService(mockEnv as any) as jest.Mocked<LineMessagingService>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGoogleSheetsService = new MockGoogleSheetsService(mockEnv as any) as jest.Mocked<GoogleSheetsService>;

    mockLineService.replyText = jest.fn();
    mockLineService.replyTemplateButton = jest.fn();

    messageHandler = new MessageHandler(mockEnv, mockLineService, mockGoogleSheetsService);
  });

  describe('handleMessage', () => {
    it('should handle 家事管理 command', async () => {
      const replyToken = 'test-reply-token';
      await messageHandler.handleMessage(replyToken, '家事管理');

      expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(
        replyToken,
        '家事管理テンプレート',
        expect.objectContaining({
          title: '家事管理',
          text: '家事に関する操作を選択してください'
        })
      );
    });

    it('should handle 家計簿 command', async () => {
      const replyToken = 'test-reply-token';
      await messageHandler.handleMessage(replyToken, '家計簿');

      expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(
        replyToken,
        '家計簿テンプレート',
        expect.objectContaining({
          title: '家計簿',
          text: '家計簿に関する操作を選択してください'
        })
      );
    });

    it('should handle 買い出しリスト command', async () => {
      const replyToken = 'test-reply-token';
      await messageHandler.handleMessage(replyToken, '買い出しリスト');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken,
        '買い出しリストの操作を選択してください。'
      );
    });

    it('should handle default command', async () => {
      const replyToken = 'test-reply-token';
      await messageHandler.handleMessage(replyToken, '不明なコマンド');

      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken,
        'こんにちは！何かお手伝いできることはありますか？'
      );
    });

    it('should handle chat command', async () => {
      const replyToken = 'test-reply-token';
      const mockChatHandler = {
        handleMessage: jest.fn().mockResolvedValue('テストチャットメッセージ')
      };
      
      // ChatHandlerのモックを注入
      (messageHandler as any).chatHandler = mockChatHandler;

      await messageHandler.handleMessage(replyToken, 'うさこ こんにちは');

      expect(mockChatHandler.handleMessage).toHaveBeenCalledWith('うさこ こんにちは');
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        replyToken, 
        'テストチャットメッセージ'
      );
    });
  });

  describe('run method', () => {
    it('should call purchaseHandler initialize', async () => {
      const initializeSpy = jest.spyOn(messageHandler['purchaseHandler'], 'initialize');
      
      await messageHandler['run']();

      expect(initializeSpy).toHaveBeenCalled();
    });
  });
});

describe('MessageHandler Tutorial Functionality', () => {
  let messageHandler: MessageHandler;
  let mockLineService: jest.Mocked<LineMessagingService>;
  let mockSheetsService: jest.Mocked<GoogleSheetsService>;
  let mockEnv: Env;

  beforeEach(() => {
    mockLineService = {
      replyTemplateButton: jest.fn(),
      replyText: jest.fn(),
    } as any;

    mockSheetsService = {
      // モックに必要なメソッドを追加
    } as any;

    mockEnv = {
      // 必要な環境変数をモック
    } as Env;

    messageHandler = new MessageHandler(mockEnv, mockLineService, mockSheetsService);
  });

  describe('Tutorial Functionality', () => {
    const mockReplyToken = 'test-reply-token';

    it('should handle tutorial message for housework', async () => {
      await messageHandler.handleMessage(mockReplyToken, '家事管理');
      
      expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(
        mockReplyToken,
        '家事管理テンプレート',
        expect.objectContaining({
          title: '家事管理',
          text: expect.any(String),
          actions: expect.arrayContaining([
            expect.objectContaining({ type: 'postback', label: '報告する' }),
            expect.objectContaining({ type: 'postback', label: '確認する' })
          ])
        })
      );
    });

    it('should handle tutorial message for account book', async () => {
      await messageHandler.handleMessage(mockReplyToken, '家計簿');
      
      expect(mockLineService.replyTemplateButton).toHaveBeenCalledWith(
        mockReplyToken,
        '家計簿テンプレート',
        expect.objectContaining({
          title: '家計簿',
          text: expect.any(String),
          actions: expect.arrayContaining([
            expect.objectContaining({ type: 'postback', label: '報告する' }),
            expect.objectContaining({ type: 'postback', label: '確認する' }),
            expect.objectContaining({ type: 'postback', label: '今月の支出' })
          ])
        })
      );
    });

    it('should handle tutorial message for purchase list', async () => {
      await messageHandler.handleMessage(mockReplyToken, '買い出しリスト');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        mockReplyToken,
        '買い出しリストの操作を選択してください。'
      );
    });
  });
}); 