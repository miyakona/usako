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
    const MockGoogleSheetsService = GoogleSheetsService as jest.MockedClass<typeof GoogleSheetsService>;
    const MockLineMessagingService = LineMessagingService as jest.MockedClass<typeof LineMessagingService>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSheetsService = new MockGoogleSheetsService({} as any) as jest.Mocked<GoogleSheetsService>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLineService = new MockLineMessagingService({} as any) as jest.Mocked<LineMessagingService>;

    // モックの設定
    mockSheetsService.getRandomChatMessage = jest.fn().mockResolvedValue('ランダムなメッセージ');
    mockLineService.replyText = jest.fn();
    mockLineService.replyTemplateButton = jest.fn();
    mockLineService.pushAll = jest.fn();
    mockLineService.push = jest.fn();
    mockLineService.replyTemplateCarousel = jest.fn();
    
    chatHandler = new ChatHandler(mockLineService, mockSheetsService);
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
    });

    it('should return a random message for other inputs', async () => {
      const response = await chatHandler.handleMessage('こんにちは');
      
      expect(response).toBe('ランダムなメッセージ');
      expect(mockSheetsService.getRandomChatMessage).toHaveBeenCalled();
    });
  });
}); 