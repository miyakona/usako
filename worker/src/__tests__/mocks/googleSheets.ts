export const mockGetValues = jest.fn();
export const mockSetValues = jest.fn();
export const mockAppendValues = jest.fn();
export const mockDeleteRows = jest.fn();

export const GoogleSheetsService = jest.fn().mockImplementation(() => ({
  getValues: mockGetValues,
  setValues: mockSetValues,
  appendValues: mockAppendValues,
  deleteRows: mockDeleteRows
})); 