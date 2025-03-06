import { GoogleSheetsService } from '../../services/googleSheets';
import { Env } from '../../types';
import { google } from 'googleapis';

jest.mock('googleapis');

describe('GoogleSheetsService', () => {
  let sheetsService: GoogleSheetsService;
  let mockEnv: Env;
  let mockSheets: jest.Mocked<any>;

  beforeEach(() => {
    mockSheets = {
      spreadsheets: {
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn()
        },
        get: jest.fn(),
        batchUpdate: jest.fn()
      }
    };

    (google.sheets as jest.Mock).mockReturnValue(mockSheets);

    mockEnv = {
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      LINE_CHANNEL_SECRET: 'test-secret',
      GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key: 'test-private-key',
        client_email: 'test@example.com'
      }),
      SPREADSHEET_ID: 'test-spreadsheet-id'
    };

    sheetsService = new GoogleSheetsService(mockEnv);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getValues', () => {
    it('should get values from specified sheet and range', async () => {
      const sheetName = '家事代_今月';
      const range = 'A2:E';
      const mockResponse = {
        data: {
          values: [
            ['user1', '掃除', '2024-03-10', '2024-03-10 10:00:00', '']
          ]
        }
      };

      mockSheets.spreadsheets.values.get.mockResolvedValueOnce(mockResponse);

      const result = await sheetsService.getValues(sheetName, range);

      expect(result).toEqual(mockResponse.data.values);
      expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!${range}`
      });
    });

    it('should return empty array when no values exist', async () => {
      const sheetName = '家事代_今月';
      const range = 'A2:E';
      const mockResponse = {
        data: {}
      };

      mockSheets.spreadsheets.values.get.mockResolvedValueOnce(mockResponse);

      const result = await sheetsService.getValues(sheetName, range);

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      const sheetName = '家事代_今月';
      const range = 'A2:E';

      mockSheets.spreadsheets.values.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.getValues(sheetName, range))
        .rejects
        .toThrow('Failed to get values from sheet');
    });
  });

  describe('setValues', () => {
    it('should update values in specified sheet and range', async () => {
      const sheetName = '家事代_今月';
      const range = 'A2:E2';
      const values = [['user1', '掃除', '2024-03-10', '2024-03-10 10:00:00', '済']];

      mockSheets.spreadsheets.values.update.mockResolvedValueOnce({});

      await sheetsService.setValues(sheetName, range, values);

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!${range}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    });

    it('should throw error when API call fails', async () => {
      const sheetName = '家事代_今月';
      const range = 'A2:E2';
      const values = [['user1', '掃除', '2024-03-10', '2024-03-10 10:00:00', '済']];

      mockSheets.spreadsheets.values.update.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.setValues(sheetName, range, values))
        .rejects
        .toThrow('Failed to update values in sheet');
    });
  });

  describe('appendValues', () => {
    it('should append values to specified sheet', async () => {
      const sheetName = '家事代_今月';
      const values = [['user1', '掃除', '2024-03-10', '2024-03-10 10:00:00', '']];

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({});

      await sheetsService.appendValues(sheetName, values);

      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    });

    it('should throw error when API call fails', async () => {
      const sheetName = '家事代_今月';
      const values = [['user1', '掃除', '2024-03-10', '2024-03-10 10:00:00', '']];

      mockSheets.spreadsheets.values.append.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.appendValues(sheetName, values))
        .rejects
        .toThrow('Failed to append values to sheet');
    });
  });

  describe('deleteRows', () => {
    it('should delete specified rows from sheet', async () => {
      const sheetName = '買い出しリスト';
      const startIndex = 1;
      const endIndex = 3;
      const mockSheetId = '123456';

      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [{
            properties: {
              title: sheetName,
              sheetId: mockSheetId
            }
          }]
        }
      });

      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});

      await sheetsService.deleteRows(sheetName, startIndex, endIndex);

      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });

      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: mockSheetId,
                dimension: 'ROWS',
                startIndex,
                endIndex
              }
            }
          }]
        }
      });
    });

    it('should throw error when getSheetId fails', async () => {
      const sheetName = '買い出しリスト';
      const startIndex = 1;
      const endIndex = 3;

      mockSheets.spreadsheets.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.deleteRows(sheetName, startIndex, endIndex))
        .rejects
        .toThrow('Failed to delete rows from sheet');

      expect(mockSheets.spreadsheets.batchUpdate).not.toHaveBeenCalled();
    });

    it('should throw error when batchUpdate fails', async () => {
      const sheetName = '買い出しリスト';
      const startIndex = 1;
      const endIndex = 3;
      const mockSheetId = '123456';

      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [{
            properties: {
              title: sheetName,
              sheetId: mockSheetId
            }
          }]
        }
      });

      mockSheets.spreadsheets.batchUpdate.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.deleteRows(sheetName, startIndex, endIndex))
        .rejects
        .toThrow('Failed to delete rows from sheet');
    });
  });
}); 