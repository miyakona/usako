"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googleSheets_1 = require("../../services/googleSheets");
const globals_1 = require("@jest/globals");
describe('GoogleSheetsService', () => {
    let sheetsService;
    let mockEnv;
    let mockSpreadsheets;
    beforeEach(() => {
        mockEnv = {
            LINE_CHANNEL_ACCESS_TOKEN: 'test-line-token',
            LINE_CHANNEL_SECRET: 'test-line-secret',
            SPREADSHEET_ID: 'test-spreadsheet-id',
            GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
                type: 'service_account',
                project_id: 'test-project',
                private_key: 'test-private-key',
                client_email: 'test@example.com'
            }),
            GOOGLE_SHEETS_CREDENTIALS: JSON.stringify({
                type: 'service_account',
                project_id: 'test-project',
                private_key: 'test-private-key',
                client_email: 'test@example.com'
            }),
            GOOGLE_SHEETS_SPREADSHEET_ID: 'test-sheets-spreadsheet-id'
        };
        mockSpreadsheets = {
            spreadsheets: {
                values: {
                    get: globals_1.jest.fn(),
                    update: globals_1.jest.fn(),
                    append: globals_1.jest.fn(),
                },
                get: globals_1.jest.fn(),
            },
        };
        sheetsService = new googleSheets_1.GoogleSheetsService(mockEnv);
        sheetsService._sheets = mockSpreadsheets;
    });
    afterEach(() => {
        globals_1.jest.clearAllMocks();
    });
    describe('getValues', () => {
        it('should successfully retrieve values from a sheet', async () => {
            const sheetName = 'TestSheet';
            const range = 'A1:D10';
            const mockResponse = {
                data: {
                    values: [['data1', 'data2'], ['data3', 'data4']],
                },
            };
            mockSpreadsheets.spreadsheets.values.get.mockResolvedValue(mockResponse);
            const result = await sheetsService.getValues(sheetName, range);
            expect(mockSpreadsheets.spreadsheets.values.get).toHaveBeenCalledWith({
                spreadsheetId: 'test-sheet-id',
                range: `${sheetName}!${range}`,
            });
            expect(result).toEqual(mockResponse.data.values);
        });
        it('should handle errors when retrieving values', async () => {
            const sheetName = 'TestSheet';
            const range = 'A1:D10';
            mockSpreadsheets.spreadsheets.values.get.mockRejectedValue(new Error('API Error'));
            await expect(sheetsService.getValues(sheetName, range)).rejects.toThrow('API Error');
        });
    });
    describe('setValues', () => {
        it('should successfully update values in a sheet', async () => {
            const sheetName = 'TestSheet';
            const range = 'A1:D10';
            const values = [['new1', 'new2'], ['new3', 'new4']];
            const mockResponse = { data: {} };
            mockSpreadsheets.spreadsheets.values.update.mockResolvedValue(mockResponse);
            await sheetsService.setValues(sheetName, range, values);
            expect(mockSpreadsheets.spreadsheets.values.update).toHaveBeenCalledWith({
                spreadsheetId: 'test-sheet-id',
                range: `${sheetName}!${range}`,
                valueInputOption: 'RAW',
                requestBody: { values },
            });
        });
        it('should handle errors when updating values', async () => {
            const sheetName = 'TestSheet';
            const range = 'A1:D10';
            const values = [['new1', 'new2'], ['new3', 'new4']];
            mockSpreadsheets.spreadsheets.values.update.mockRejectedValue(new Error('Update Error'));
            await expect(sheetsService.setValues(sheetName, range, values)).rejects.toThrow('Update Error');
        });
    });
    describe('getRandomChatMessage', () => {
        it('should return a random chat message', async () => {
            const mockMessages = [['message1'], ['message2'], ['message3']];
            globals_1.jest.spyOn(sheetsService, 'getValues').mockResolvedValue(mockMessages);
            const result = await sheetsService.getRandomChatMessage();
            expect(result).toMatch(/message[123]/);
        });
        it('should handle empty messages array', async () => {
            globals_1.jest.spyOn(sheetsService, 'getValues').mockResolvedValue([]);
            const result = await sheetsService.getRandomChatMessage();
            expect(result).toBe('');
        });
    });
    describe('addChatMessage', () => {
        it('should add a chat message to the sheet', async () => {
            const message = 'Test chat message';
            const mockResponse = { data: {} };
            mockSpreadsheets.spreadsheets.values.append.mockResolvedValue(mockResponse);
            await sheetsService.addChatMessage(message);
            expect(mockSpreadsheets.spreadsheets.values.append).toHaveBeenCalledWith({
                spreadsheetId: 'test-sheet-id',
                range: 'ChatMessages!A:A',
                valueInputOption: 'RAW',
                requestBody: { values: [[message]] },
            });
        });
        it('should handle errors when adding a chat message', async () => {
            const message = 'Test chat message';
            mockSpreadsheets.spreadsheets.values.append.mockRejectedValue(new Error('Append Error'));
            await expect(sheetsService.addChatMessage(message)).rejects.toThrow('Append Error');
        });
    });
});
