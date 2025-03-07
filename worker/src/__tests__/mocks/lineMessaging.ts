import { LineMessagingService } from '../../services/lineMessaging';

export const mockReplyText = jest.fn();
export const mockReplyTemplateButton = jest.fn();
export const mockReplyTemplateCarousel = jest.fn();
export const mockPushMessage = jest.fn();

export const LineMessagingServiceMock = jest.fn().mockImplementation(() => ({
  replyText: mockReplyText,
  replyTemplateButton: mockReplyTemplateButton,
  replyTemplateCarousel: mockReplyTemplateCarousel,
  pushMessage: mockPushMessage
}));

export const createMockLineMessagingService = (): jest.Mocked<LineMessagingService> => {
  const mock = {
    pushAll: jest.fn().mockResolvedValue(undefined),
    replyText: jest.fn().mockResolvedValue(undefined),
    replyTemplateButton: jest.fn().mockResolvedValue(undefined),
    replyTemplateCarousel: jest.fn().mockResolvedValue(undefined),
    pushMessage: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockResolvedValue(undefined),
  };
  return mock as unknown as jest.Mocked<LineMessagingService>;
};

describe('LineMessagingMock', () => {
  it('should create a mock LineMessagingService', () => {
    const mockService = createMockLineMessagingService();
    expect(mockService.pushAll).toBeDefined();
    expect(mockService.replyText).toBeDefined();
    expect(mockService.replyTemplateButton).toBeDefined();
    expect(mockService.replyTemplateCarousel).toBeDefined();
    expect(mockService.push).toBeDefined();
  });
}); 