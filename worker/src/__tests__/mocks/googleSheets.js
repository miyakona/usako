"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = exports.mockAddChatMessage = exports.mockGetRandomChatMessage = exports.mockDeleteRows = exports.mockAppendValues = exports.mockSetValues = exports.mockGetValues = void 0;
exports.mockGetValues = jest.fn();
exports.mockSetValues = jest.fn();
exports.mockAppendValues = jest.fn();
exports.mockDeleteRows = jest.fn();
exports.mockGetRandomChatMessage = jest.fn();
exports.mockAddChatMessage = jest.fn();
exports.GoogleSheetsService = jest.fn().mockImplementation(() => ({
    getValues: exports.mockGetValues,
    setValues: exports.mockSetValues,
    appendValues: exports.mockAppendValues,
    deleteRows: exports.mockDeleteRows,
    getRandomChatMessage: exports.mockGetRandomChatMessage,
    addChatMessage: exports.mockAddChatMessage
}));
describe('GoogleSheetsMock', () => {
    it('should be a placeholder test', () => {
        expect(true).toBe(true);
    });
});
