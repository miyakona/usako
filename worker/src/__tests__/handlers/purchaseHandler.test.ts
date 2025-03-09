import { PurchaseHandler } from '../../handlers/purchaseHandler';
import { Env } from '../../types';
import { LineMessagingService } from '../../services/lineMessaging';
import { GoogleSheetsService } from '../../services/googleSheets';

describe('PurchaseHandler', () => {
  let purchaseHandler: PurchaseHandler;
  let mockLineService: jest.Mocked<LineMessagingService>;
  let mockSheetsService: jest.Mocked<GoogleSheetsService>;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      LINE_CHANNEL_SECRET: 'test-secret',
      GOOGLE_SHEETS_SPREADSHEET_ID: 'test-spreadsheet',
      GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
      SPREADSHEET_ID: 'test-id',
      GOOGLE_SHEETS_CREDENTIALS: 'test-credentials'
    };

    mockLineService = {
      replyText: jest.fn().mockResolvedValue(undefined),
      pushAll: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockSheetsService = {
      getValues: jest.fn().mockResolvedValue([]),
      setValues: jest.fn().mockResolvedValue(undefined),
      addChatMessage: jest.fn().mockResolvedValue(undefined),
      getRandomChatMessage: jest.fn().mockResolvedValue('テストメッセージ')
    } as any;

    purchaseHandler = new PurchaseHandler(mockSheetsService, mockLineService);
  });

  describe('handleMessage', () => {
    it('should handle purchase list message', async () => {
      const message = `買い出し
オレンジ
いちご
欲しい`;

      const result = await purchaseHandler.handleMessage(message);

      expect(result).toContain('買い出しリストに追加しておいたよ！');
      expect(mockSheetsService.setValues).toHaveBeenCalledWith(
        '買い出しリスト', 
        'A2:B', 
        [['オレンジ', ''], ['いちご', '']]
      );
    });

    it('フォーマットエラーの場合はエラーメッセージを返すこと', async () => {
      const result = await purchaseHandler.handleMessage('買い出し');
      
      expect(result).toContain('フォーマットエラーだよ！');
      expect(result).toContain('①リストを確認');
      expect(result).toContain('②リストから削除');
      expect(result).toContain('③リストに追加');
      expect(result).toContain('④リストから全削除');
    });

    it('リストコマンドの場合はgetListを呼び出すこと', async () => {
      const mockValues = [['りんご', ''], ['バナナ', '済']];
      mockSheetsService.getValues = jest.fn().mockResolvedValue(mockValues);
      
      const result = await purchaseHandler.handleMessage('買い出し\nリスト');
      
      expect(mockSheetsService.getValues).toHaveBeenCalledWith('買い出しリスト', 'A2:B');
      expect(result).toContain('買い出しリストには、いま以下の品目が登録されてるよ！');
      expect(result).toContain('りんご');
      expect(result).not.toContain('バナナ');
    });

    it('リストが空の場合は適切なメッセージを返すこと', async () => {
      mockSheetsService.getValues = jest.fn().mockResolvedValue([]);
      
      const result = await purchaseHandler.handleMessage('買い出し\nリスト');
      
      expect(result).toContain('今登録されている品目はないよ');
    });

    it('全ての品目が済の場合は空のメッセージを返すこと', async () => {
      mockSheetsService.getValues = jest.fn().mockResolvedValue([['りんご', '済'], ['バナナ', '済']]);
      
      const result = await purchaseHandler.handleMessage('買い出し\nリスト');
      
      expect(result).toContain('今登録されている品目はないよ');
    });

    it('買ったよコマンドの場合はdeleteを呼び出すこと', async () => {
      const mockValues = [['りんご', ''], ['バナナ', '済']];
      mockSheetsService.getValues = jest.fn().mockResolvedValue(mockValues);
      mockSheetsService.setValues = jest.fn().mockResolvedValue(undefined);
      
      const result = await purchaseHandler.handleMessage('買い出し\nりんご\n買ったよ');
      
      expect(mockSheetsService.getValues).toHaveBeenCalledWith('買い出しリスト', 'A2:B');
      expect(mockSheetsService.setValues).toHaveBeenCalledWith('買い出しリスト', 'B2', [['済']]);
      expect(result).toBe('リストから品目を消しておいたよ〜');
    });

    it('買ったよコマンドで品目が見つからない場合はエラーメッセージを返すこと', async () => {
      mockSheetsService.getValues = jest.fn().mockResolvedValue([['りんご', '済'], ['バナナ', '済']]);
      
      const result = await purchaseHandler.handleMessage('買い出し\nオレンジ\n買ったよ');
      
      expect(result).toContain('教えてもらった品目がリストに無いよ！');
    });

    it('欲しいコマンドの場合はaddを呼び出すこと', async () => {
      const result = await purchaseHandler.handleMessage('買い出し\nオレンジ\nいちご\n欲しい');
      
      expect(mockSheetsService.setValues).toHaveBeenCalledWith(
        '買い出しリスト', 
        'A2:B', 
        [['オレンジ', ''], ['いちご', '']]
      );
      expect(result).toContain('買い出しリストに追加しておいたよ！');
    });

    it('欲しいコマンドで品目が指定されていない場合はエラーメッセージを返すこと', async () => {
      const result = await purchaseHandler.handleMessage('買い出し\n欲しい');
      
      expect(result).toContain('品目が指定されていないみたいだよ');
    });

    it('全消しコマンドの場合はdeleteAllを呼び出すこと', async () => {
      const mockValues = [['りんご', ''], ['バナナ', '']];
      mockSheetsService.getValues = jest.fn().mockResolvedValue(mockValues);
      mockSheetsService.setValues = jest.fn().mockResolvedValue(undefined);
      
      const result = await purchaseHandler.handleMessage('買い出し\n全消し');
      
      expect(mockSheetsService.getValues).toHaveBeenCalledWith('買い出しリスト', 'A2:B');
      expect(mockSheetsService.setValues).toHaveBeenCalledTimes(2);
      expect(result).toBe('リストから全ての品目を消しておいたよ〜');
    });

    it('全消しコマンドでリストが空の場合はエラーメッセージを返すこと', async () => {
      mockSheetsService.getValues = jest.fn().mockResolvedValue([]);
      
      const result = await purchaseHandler.handleMessage('買い出し\n全消し');
      
      expect(result).toContain('まだリストに登録されてるものが無いみたい');
    });

    it('不明なコマンドの場合はエラーメッセージを返すこと', async () => {
      const result = await purchaseHandler.handleMessage('買い出し\n不明なコマンド');
      
      expect(result).toBe('「リスト」「買ったよ」「欲しい」「全消し」のどれかで話しかけて…！！！');
    });
  });

  describe('getTemplateColumn', () => {
    it('正しいテンプレートカラムを返すこと', () => {
      const result = purchaseHandler.getTemplateColumn();
      
      expect(result).toHaveProperty('title', '買い物リストの管理');
      expect(result).toHaveProperty('text');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]).toHaveProperty('type', 'message');
      expect(result.actions[0]).toHaveProperty('label', 'リストを見てみる');
      expect(result.actions[0]).toHaveProperty('text', '買い物リスト');
    });
  });

  describe('handlePurchaseList', () => {
    it('should add items to purchase list', async () => {
      const message = '買い出しリスト オレンジ いちご';

      const result = await purchaseHandler.handleMessage(message);

      expect(mockSheetsService.setValues).toHaveBeenCalledWith(
        '買い出しリスト', 
        'A2:B', 
        [['オレンジ', ''], ['いちご', '']]
      );
    });
  });
}); 