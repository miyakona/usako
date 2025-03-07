export const mockGetValues = jest.fn();
export const mockSetValues = jest.fn();
export const mockAppendValues = jest.fn();
export const mockDeleteRows = jest.fn();
export const mockGetRandomChatMessage = jest.fn();
export const mockAddChatMessage = jest.fn();

export const GoogleSheetsService = jest.fn().mockImplementation(() => ({
  getValues: mockGetValues,
  setValues: mockSetValues,
  appendValues: mockAppendValues,
  deleteRows: mockDeleteRows,
  getRandomChatMessage: mockGetRandomChatMessage,
  addChatMessage: mockAddChatMessage
}));

describe('GoogleSheetsMock', () => {
  it('should be a placeholder test', () => {
    expect(true).toBe(true);
  });
}); 