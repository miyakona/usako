"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
const googleapis_1 = require("googleapis");
const google_spreadsheet_1 = require("google-spreadsheet");
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class GoogleSheetsService {
    constructor(env) {
        if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) {
            throw new Error('GOOGLE_SHEETS_SPREADSHEET_IDが設定されていません');
        }
        if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            throw new Error('GOOGLE_SERVICE_ACCOUNT_KEYが設定されていません');
        }
        this.spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
        try {
            // Base64デコードを追加
            const decodedCredentials = atob(env.GOOGLE_SERVICE_ACCOUNT_KEY);
            this.credentials = JSON.parse(decodedCredentials);
            console.log('Credentials details:', {
                clientEmail: this.credentials.client_email,
                projectId: this.credentials.project_id,
                privateKeyAvailable: !!this.credentials.private_key
            });
            // OAuth2Clientを使用
            this.auth = new google_auth_library_1.OAuth2Client({
                clientId: this.credentials.client_id,
                clientSecret: this.credentials.client_secret
            });
            // カスタムアクセストークン取得メソッド
            const generateAccessToken = async () => {
                const now = Math.floor(Date.now() / 1000);
                const payload = {
                    iss: this.credentials.client_email,
                    sub: this.credentials.client_email,
                    aud: 'https://oauth2.googleapis.com/token',
                    iat: now,
                    exp: now + 3600, // 1時間有効
                    scope: 'https://www.googleapis.com/auth/spreadsheets'
                };
                console.log('Generated JWT payload:', payload);
                try {
                    // JWTを手動で署名
                    const signedJwt = jsonwebtoken_1.default.sign(payload, this.credentials.private_key, {
                        algorithm: 'RS256'
                    });
                    console.log('JWT signed successfully');
                    // トークンリクエスト
                    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                            assertion: signedJwt
                        })
                    });
                    if (!tokenResponse.ok) {
                        const errorText = await tokenResponse.text();
                        console.error('Token request failed:', {
                            status: tokenResponse.status,
                            statusText: tokenResponse.statusText,
                            errorText
                        });
                        throw new Error(`Token request failed: ${errorText}`);
                    }
                    const tokenData = await tokenResponse.json();
                    console.log('Token response received:', {
                        tokenType: tokenData.token_type,
                        expiresIn: tokenData.expires_in
                    });
                    // アクセストークンを設定
                    this.auth.setCredentials({
                        access_token: tokenData.access_token,
                        token_type: tokenData.token_type,
                        expiry_date: now + tokenData.expires_in
                    });
                    return tokenData.access_token;
                }
                catch (error) {
                    console.error('Access token generation error:', {
                        errorType: typeof error,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : 'No stack trace'
                    });
                    throw error;
                }
            };
            // トークン取得メソッドを設定
            this.auth.getAccessToken = generateAccessToken;
            this.client = new google_spreadsheet_1.GoogleSpreadsheet(this.spreadsheetId, this.auth);
            this.sheets = googleapis_1.google.sheets({ version: 'v4', auth: this.auth });
            console.log('Google Sheets service initialized successfully');
        }
        catch (error) {
            console.error('Error initializing GoogleSheetsService:', {
                errorType: typeof error,
                errorMessage: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            throw error;
        }
    }
    async getValues(sheetName, range) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`
            });
            return response.data.values || [];
        }
        catch (error) {
            throw new Error('Failed to get values from sheet');
        }
    }
    async getLastRow(sheetName) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:A`
            });
            return response.data.values ? response.data.values.length : 0;
        }
        catch (error) {
            throw new Error('Failed to get last row');
        }
    }
    async getLastColumn(sheetName) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!1:1`
            });
            return response.data.values ? response.data.values[0].length : 0;
        }
        catch (error) {
            throw new Error('Failed to get last column');
        }
    }
    async setValue(sheetName, cell, value) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${cell}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[value]] }
            });
        }
        catch (error) {
            throw new Error('Failed to set value');
        }
    }
    async setValues(sheetName, range, values) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values }
            });
        }
        catch (error) {
            throw new Error('Failed to update values in sheet');
        }
    }
    async clearSheet(sheetName) {
        try {
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`
            });
        }
        catch (error) {
            throw new Error('Failed to clear sheet');
        }
    }
    async getAccountBookSummary() {
        try {
            const sheetName = '家計簿';
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`
            });
            const values = response.data.values || [];
            const totalIncome = values
                .filter((row) => row[0] === '収入')
                .reduce((sum, row) => sum + parseFloat(row[2] || 0), 0);
            const totalExpense = values
                .filter((row) => row[0] === '支出')
                .reduce((sum, row) => sum + parseFloat(row[2] || 0), 0);
            return `月次サマリ：
収入: ${totalIncome}円
支出: ${totalExpense}円
収支: ${totalIncome - totalExpense}円`;
        }
        catch (error) {
            throw new Error('Failed to get account book summary');
        }
    }
    async getRandomChatMessage() {
        const sheetName = 'うさこの言葉';
        const errorMessage = 'シートにアクセスできませんでした。システム管理者に連絡してください。';
        try {
            console.log('Attempting to get spreadsheet metadata', {
                spreadsheetId: this.spreadsheetId,
                includeGridData: false
            });
            let response;
            try {
                response = await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                    includeGridData: false
                });
            }
            catch (getError) {
                console.error('Error in spreadsheets.get():', {
                    errorType: typeof getError,
                    errorMessage: getError instanceof Error ? getError.message : String(getError),
                    stack: getError instanceof Error ? getError.stack : 'No stack trace'
                });
                throw getError;
            }
            console.log('Spreadsheet get response received:', {
                sheetsCount: response.data.sheets?.length,
                sheetTitles: response.data.sheets?.map(sheet => sheet.properties.title)
            });
            const sheetExists = response.data.sheets.some((sheet) => sheet.properties.title === sheetName);
            console.log(`Sheet "${sheetName}" exists:`, sheetExists);
            if (!sheetExists) {
                console.error(`Sheet "${sheetName}" does not exist`);
                throw new Error(`シート "${sheetName}" が見つかりません`);
            }
            let messagesResponse;
            try {
                messagesResponse = await this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A:A`
                });
            }
            catch (valuesError) {
                console.error('Error in spreadsheets.values.get():', {
                    errorType: typeof valuesError,
                    errorMessage: valuesError instanceof Error ? valuesError.message : String(valuesError),
                    stack: valuesError instanceof Error ? valuesError.stack : 'No stack trace'
                });
                throw valuesError;
            }
            console.log('Messages retrieval response:', {
                valuesCount: messagesResponse.data.values?.length
            });
            const messages = messagesResponse.data.values || [];
            if (messages.length === 0) {
                console.error('No messages found in sheet');
                throw new Error('シートにメッセージが見つかりません');
            }
            const randomIndex = Math.floor(Math.random() * messages.length);
            return messages[randomIndex][0];
        }
        catch (error) {
            console.error('Error in getRandomChatMessage:', {
                errorType: typeof error,
                errorMessage: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            throw new Error(errorMessage);
        }
    }
    async addChatMessage(message) {
        try {
            const sheetName = 'うさこの言葉';
            const exists = await this.sheetExists(sheetName);
            if (!exists) {
                await this.createSheet(sheetName);
            }
            await this.appendValues(sheetName, [[message]]);
        }
        catch (error) {
            throw new Error(`Failed to add chat message: ${error.message}`);
        }
    }
    // プライベートヘルパーメソッド
    async sheetExists(sheetName) {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            return response.data.sheets.some((s) => s.properties.title === sheetName);
        }
        catch (error) {
            throw new Error(`Failed to check if sheet exists: ${error.message}`);
        }
    }
    async createSheet(sheetName) {
        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
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
        }
        catch (error) {
            throw new Error(`Failed to create sheet: ${error.message}`);
        }
    }
    async appendValues(sheetName, values) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: sheetName,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values }
            });
        }
        catch (error) {
            throw new Error('Failed to append values to sheet');
        }
    }
}
exports.GoogleSheetsService = GoogleSheetsService;
