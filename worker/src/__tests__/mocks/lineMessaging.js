"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockLineMessagingService = exports.LineMessagingServiceMock = exports.mockPushMessage = exports.mockReplyTemplateCarousel = exports.mockReplyTemplateButton = exports.mockReplyText = void 0;
exports.mockReplyText = jest.fn();
exports.mockReplyTemplateButton = jest.fn();
exports.mockReplyTemplateCarousel = jest.fn();
exports.mockPushMessage = jest.fn();
exports.LineMessagingServiceMock = jest.fn().mockImplementation(() => ({
    replyText: exports.mockReplyText,
    replyTemplateButton: exports.mockReplyTemplateButton,
    replyTemplateCarousel: exports.mockReplyTemplateCarousel,
    pushMessage: exports.mockPushMessage
}));
const createMockLineMessagingService = () => {
    const mock = {
        pushAll: jest.fn().mockResolvedValue(undefined),
        replyText: jest.fn().mockResolvedValue(undefined),
        replyTemplateButton: jest.fn().mockResolvedValue(undefined),
        replyTemplateCarousel: jest.fn().mockResolvedValue(undefined),
        pushMessage: jest.fn().mockResolvedValue(undefined),
        push: jest.fn().mockResolvedValue(undefined),
    };
    return mock;
};
exports.createMockLineMessagingService = createMockLineMessagingService;
describe('LineMessagingMock', () => {
    it('should create a mock LineMessagingService', () => {
        const mockService = (0, exports.createMockLineMessagingService)();
        expect(mockService.pushAll).toBeDefined();
        expect(mockService.replyText).toBeDefined();
        expect(mockService.replyTemplateButton).toBeDefined();
        expect(mockService.replyTemplateCarousel).toBeDefined();
        expect(mockService.push).toBeDefined();
    });
});
