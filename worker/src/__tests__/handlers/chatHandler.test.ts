import { ChatHandler } from '../../handlers/chatHandler';
import { GoogleSheetsService } from '../../services/googleSheets';
import { LineMessagingService } from '../../services/lineMessaging';

jest.mock('../../services/googleSheets');
jest.mock('../../services/lineMessaging');

describe('ChatHandler', () => {
  let chatHandler: ChatHandler;
  let mockSheetsService: jest.Mocked<GoogleSheetsService>;
  let mockLineService: jest.Mocked<LineMessagingService>;

  beforeEach(() => {
    mockSheetsService = new GoogleSheetsService({} as any) as jest.Mocked<GoogleSheetsService>;
    mockLineService = new LineMessagingService({} as any) as jest.Mocked<LineMessagingService>;
    chatHandler = new ChatHandler(mockSheetsService, mockLineService);
    
    // モックの設定
    mockSheetsService.getRandomChatMessage = jest.fn().mockResolvedValue('ランダムなメッセージ');
  });

  describe('getTemplateColumn', () => {
    it('should return the correct template structure', () => {
      const template = chatHandler.getTemplateColumn();
      
      expect(template).toHaveProperty('thumbnailImageUrl');
      expect(template).toHaveProperty('title', 'うさことおしゃべり');
      expect(template).toHaveProperty('text');
      expect(template).toHaveProperty('actions');
      expect(template.actions).toHaveLength(1);
      expect(template.actions[0]).toHaveProperty('type', 'message');
      expect(template.actions[0]).toHaveProperty('label', 'おしゃべり！');
      expect(template.actions[0]).toHaveProperty('text', 'うさこ〜〜〜');
    });
  });

  describe('handleMessage', () => {
    it('should return a specific response for うさこ〜〜〜', async () => {
      const response = await chatHandler.handleMessage('うさこ〜〜〜');
      
      expect(response).toBe('どうしたの？何か話したいことある？');
      expect(mockSheetsService.getRandomChatMessage).not.toHaveBeenCalled();
    });

    it('should return a random message for other inputs', async () => {
      const response = await chatHandler.handleMessage('こんにちは');
      
      expect(response).toBe('ランダムなメッセージ');
      expect(mockSheetsService.getRandomChatMessage).toHaveBeenCalled();
    });
  });
}); 