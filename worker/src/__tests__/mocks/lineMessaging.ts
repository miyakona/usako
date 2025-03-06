export const mockReplyText = jest.fn();
export const mockReplyTemplateButton = jest.fn();
export const mockReplyTemplateCarousel = jest.fn();
export const mockPushMessage = jest.fn();

export const LineMessagingService = jest.fn().mockImplementation(() => ({
  replyText: mockReplyText,
  replyTemplateButton: mockReplyTemplateButton,
  replyTemplateCarousel: mockReplyTemplateCarousel,
  pushMessage: mockPushMessage
})); 