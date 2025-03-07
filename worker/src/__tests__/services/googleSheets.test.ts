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

  describe('sheetExists', () => {
    it('should return true when sheet exists', async () => {
      const sheetName = 'うさこの言葉';
      
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName } },
            { properties: { title: 'Sheet3' } }
          ]
        }
      });

      const result = await sheetsService.sheetExists(sheetName);
      
      expect(result).toBe(true);
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
    });

    it('should return false when sheet does not exist', async () => {
      const sheetName = 'うさこの言葉';
      
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: 'Sheet2' } },
            { properties: { title: 'Sheet3' } }
          ]
        }
      });

      const result = await sheetsService.sheetExists(sheetName);
      
      expect(result).toBe(false);
    });

    it('should throw error when API call fails', async () => {
      const sheetName = 'うさこの言葉';
      
      mockSheets.spreadsheets.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.sheetExists(sheetName))
        .rejects
        .toThrow('Failed to check if sheet exists');
    });
  });

  describe('createSheet', () => {
    it('should create a new sheet with the specified name', async () => {
      const sheetName = 'うさこの言葉';
      
      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});

      await sheetsService.createSheet(sheetName);
      
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
    });

    it('should throw error when API call fails', async () => {
      const sheetName = 'うさこの言葉';
      
      mockSheets.spreadsheets.batchUpdate.mockRejectedValueOnce(new Error('API Error'));

      await expect(sheetsService.createSheet(sheetName))
        .rejects
        .toThrow('Failed to create sheet');
    });
  });

  describe('initializeSheet', () => {
    it('should create sheet and set headers when sheet does not exist', async () => {
      const sheetName = '買い出しリスト';
      const headers = ['品目', 'ステータス'];
      const mockSheetId = '123456';
      
      // シートが存在しない
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } }
          ]
        }
      });
      
      // シート作成
      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});
      
      // ヘッダー設定
      mockSheets.spreadsheets.values.update.mockResolvedValueOnce({});
      
      // シートID取得
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName, sheetId: mockSheetId } }
          ]
        }
      });
      
      // 列幅調整
      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});

      await sheetsService.initializeSheet(sheetName, headers);
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // シート作成
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
      
      // ヘッダー設定
      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] }
      });
    });

    it('should only set headers when sheet already exists', async () => {
      const sheetName = '買い出しリスト';
      const headers = ['品目', 'ステータス'];
      const mockSheetId = '123456';
      
      // シートが存在する
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName } }
          ]
        }
      });
      
      // ヘッダー設定
      mockSheets.spreadsheets.values.update.mockResolvedValueOnce({});
      
      // シートID取得
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName, sheetId: mockSheetId } }
          ]
        }
      });
      
      // 列幅調整
      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});

      await sheetsService.initializeSheet(sheetName, headers);
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // シート作成は呼ばれない
      expect(mockSheets.spreadsheets.batchUpdate).not.toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
      
      // ヘッダー設定
      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] }
      });
    });
  });

  describe('getRandomChatMessage', () => {
    it('should return a random message from the sheet', async () => {
      const sheetName = 'うさこの言葉';
      const messages = [
        ['こんにちは！'],
        ['元気ですか？'],
        ['今日も頑張りましょう！']
      ];
      
      // シートが存在する
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName } }
          ]
        }
      });
      
      // メッセージを取得
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: messages
        }
      });
      
      // crypto.getRandomValuesをモック
      const originalCrypto = (global as any).crypto;
      const mockGetRandomValues = jest.fn().mockImplementation((array) => {
        array[0] = 1; // 0-2の範囲で1を選択するように固定
        return array;
      });
      
      Object.defineProperty(global, 'crypto', {
        value: {
          getRandomValues: mockGetRandomValues
        },
        configurable: true
      });
      
      const result = await sheetsService.getRandomChatMessage();
      
      // 元のcryptoを復元
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        configurable: true
      });
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // メッセージの取得
      expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!A1:A`
      });
      
      // 乱数生成の呼び出し
      expect(mockGetRandomValues).toHaveBeenCalled();
      
      // 結果の確認（インデックス1のメッセージ）
      expect(result).toBe('こんにちは！');
    });

    it('should create sheet and return default message when sheet does not exist', async () => {
      const sheetName = 'うさこの言葉';
      
      // シートが存在しない
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } }
          ]
        }
      });
      
      // シート作成
      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});
      
      // デフォルトメッセージ設定
      mockSheets.spreadsheets.values.update.mockResolvedValueOnce({});
      
      const result = await sheetsService.getRandomChatMessage();
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // シート作成
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
      
      // デフォルトメッセージ設定
      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['こんにちは！']] }
      });
      
      // 結果の確認
      expect(result).toBe('こんにちは！');
    });

    it('should return default message when sheet is empty', async () => {
      const sheetName = 'うさこの言葉';
      
      // シートが存在する
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName } }
          ]
        }
      });
      
      // 空のメッセージ配列
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: []
        }
      });
      
      const result = await sheetsService.getRandomChatMessage();
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // メッセージの取得
      expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: `${sheetName}!A1:A`
      });
      
      // 結果の確認
      expect(result).toBe('こんにちは！');
    });
  });

  describe('addChatMessage', () => {
    it('should add a new message to the sheet', async () => {
      const sheetName = 'うさこの言葉';
      const message = 'こんばんは！';
      
      // シートが存在する
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } },
            { properties: { title: sheetName } }
          ]
        }
      });
      
      // メッセージを追加
      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({});

      await sheetsService.addChatMessage(message);
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // メッセージの追加
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[message]] }
      });
    });

    it('should create sheet and add message when sheet does not exist', async () => {
      const sheetName = 'うさこの言葉';
      const message = 'こんばんは！';
      
      // シートが存在しない
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: {
          sheets: [
            { properties: { title: 'Sheet1' } }
          ]
        }
      });
      
      // シート作成
      mockSheets.spreadsheets.batchUpdate.mockResolvedValueOnce({});
      
      // メッセージを追加
      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({});

      await sheetsService.addChatMessage(message);
      
      // シートの存在確認
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID
      });
      
      // シート作成
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
      
      // メッセージの追加
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: mockEnv.SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[message]] }
      });
    });
  });
}); 