import { PostbackHandler } from '../../handlers/postbackHandler';
import { LineMessagingService } from '../../services/lineMessaging';
import { GoogleSheetsService } from '../../services/googleSheets';
import { PurchaseHandler } from '../../handlers/purchaseHandler';
import { Env } from '../../types';

jest.mock('../../services/lineMessaging');
jest.mock('../../services/googleSheets');
jest.mock('../../handlers/purchaseHandler');

describe('PostbackHandler', () => {
  let postbackHandler: PostbackHandler;
  let mockLineService: jest.Mocked<LineMessagingService>;
  let mockSheetsService: jest.Mocked<GoogleSheetsService>;
  let mockPurchaseHandler: jest.Mocked<PurchaseHandler>;

  beforeEach(() => {
    // 環境変数のモック
    const mockEnv: Env = {
      SPREADSHEET_ID: 'mock-spreadsheet-id',
      GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
        client_email: 'mock-email@example.com',
        private_key: 'mock-private-key'
      }),
      LINE_CHANNEL_ACCESS_TOKEN: 'mock-token',
      LINE_CHANNEL_SECRET: 'mock-secret'
    };

    mockLineService = new LineMessagingService(mockEnv) as jest.Mocked<LineMessagingService>;
    mockSheetsService = new GoogleSheetsService(mockEnv) as jest.Mocked<GoogleSheetsService>;
    
    // PurchaseHandlerのモックを設定
    mockPurchaseHandler = {
      handleMessage: jest.fn(),
      getTemplateColumn: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PurchaseHandler>;
    
    (PurchaseHandler as jest.Mock).mockImplementation(() => mockPurchaseHandler);
    
    // LineMessagingServiceのモックを設定
    mockLineService.replyText = jest.fn().mockResolvedValue(undefined);
    (LineMessagingService as jest.Mock).mockImplementation(() => mockLineService);
    
    // GoogleSheetsServiceのモックを設定
    (GoogleSheetsService as jest.Mock).mockImplementation(() => mockSheetsService);
    
    postbackHandler = new PostbackHandler(mockEnv);
  });

  describe('handlePostback', () => {
    it('purchaseタイプのlistアクションの場合はPurchaseHandlerのhandleMessageを呼び出すこと', async () => {
      mockPurchaseHandler.handleMessage.mockResolvedValue('リスト結果');
      
      await postbackHandler.handlePostback('replyToken', '{"type":"purchase", "action":"list"}', 'userId');
      
      expect(mockPurchaseHandler.handleMessage).toHaveBeenCalledWith('買い出し\nリスト');
      expect(mockLineService.replyText).toHaveBeenCalledWith('replyToken', 'リスト結果');
    });
    
    it('purchaseタイプのaddアクションの場合は追加方法の説明を返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"purchase", "action":"add"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('品目を追加するには')
      );
    });
    
    it('purchaseタイプのdeleteアクションの場合は削除方法の説明を返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"purchase", "action":"delete"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('品目を削除するには')
      );
    });
    
    it('purchaseタイプの不明なアクションの場合はエラーメッセージを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"purchase", "action":"unknown"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        'エラー。意図しないアクションが指定されました。'
      );
    });

    it('houseworkタイプのreportアクションの場合は家事報告フォームのURLを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"housework", "action":"report"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('家事の報告だね！')
      );
    });

    it('houseworkタイプのcheckアクションの場合は家事状況を返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"housework", "action":"check"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('今日はまだ家事をやってないみたい')
      );
    });

    it('houseworkタイプの不明なアクションの場合はエラーメッセージを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"housework", "action":"unknown"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        'エラー。意図しないアクションが指定されました。'
      );
    });

    it('accountBookタイプのreportアクションの場合は家計簿報告フォームのURLを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"accountBook", "action":"report"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('家計の報告だね！')
      );
    });

    it('accountBookタイプのcheckアクションの場合は家計簿状況を返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"accountBook", "action":"check"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('報告済の支出はないみたい')
      );
    });

    it('accountBookタイプのsummaryアクションの場合は家計簿サマリを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"accountBook", "action":"summary"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        expect.stringContaining('現時点での支払内容はこんな感じだよ')
      );
    });

    it('accountBookタイプの不明なアクションの場合はエラーメッセージを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"accountBook", "action":"unknown"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        'エラー。意図しないアクションが指定されました。'
      );
    });

    it('不明なタイプの場合はエラーメッセージを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', '{"type":"unknown", "action":"test"}', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        'エラー。意図しないアクションが指定されました。'
      );
    });

    it('JSONでないデータの場合はエラーメッセージを返すこと', async () => {
      await postbackHandler.handlePostback('replyToken', 'invalid-json', 'userId');
      
      expect(mockLineService.replyText).toHaveBeenCalledWith(
        'replyToken', 
        'エラーが発生しました。もう一度お試しください。'
      );
    });
  });
}); 