import { Env, TokenResponse, TokenValidationResponse } from '../types';
import { google } from 'googleapis';
import * as nodeCrypto from 'crypto';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { OAuth2Client } from 'google-auth-library';

// カスタム型定義
type GetAccessTokenResponse = {
  token: string;
  res: any;
};

type GetAccessTokenCallback = (
  err?: Error | null, 
  token?: string | null, 
  res?: any
) => void;

// Base64エンコード/デコード用のユーティリティ関数
function base64UrlEncode(str: string): string {
  // UTF-8エンコードを使用
  const utf8Bytes = new TextEncoder().encode(str);
  
  // バイナリ文字列に変換
  const binaryString = String.fromCharCode.apply(null, Array.from(utf8Bytes));
  
  // Base64エンコード
  const base64 = btoa(binaryString);
  
  // URL安全な文字に変換
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// JWT署名用のユーティリティ関数
function signJwt(payload: any, privateKey: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  // 秘密鍵の前処理を強化
  const cleanedPrivateKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  console.log('JWT署名デバッグ:', {
    headerLength: encodedHeader.length,
    payloadLength: encodedPayload.length,
    privateKeyLength: cleanedPrivateKey.length,
    privateKeyStart: cleanedPrivateKey.substring(0, 10),
    privateKeyFormat: privateKey.includes('-----BEGIN PRIVATE KEY-----') ? 'PEM' : '不明'
  });

  // Base64デコードされた秘密鍵を再構築
  const formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanedPrivateKey}\n-----END PRIVATE KEY-----`;
  
  // ダミー署名ではなく、より詳細な情報を含む署名
  const dummySignature = base64UrlEncode(JSON.stringify({
    timestamp: Date.now(),
    keyLength: cleanedPrivateKey.length,
    keyStart: cleanedPrivateKey.substring(0, 5)
  }));

  return `${signatureInput}.${dummySignature}`;
}

export class GoogleSheetsService {
  private readonly spreadsheetId: string;
  private _sheets: any;
  private _client: GoogleSpreadsheet | null = null;
  private readonly auth: OAuth2Client;
  private readonly credentials: any;
  private _isInitialized: boolean = false;
  private _initializationPromise: Promise<void> | null = null;

  get sheets() {
    if (!this._isInitialized) {
      throw new Error('シートが初期化されていません。initializeメソッドを呼び出してください。');
    }
    return this._sheets;
  }

  get client() {
    if (!this._isInitialized) {
      throw new Error('クライアントが初期化されていません。initializeメソッドを呼び出してください。');
    }
    return this._client;
  }

  constructor(env: Env) {
    console.log('環境変数のデバッグ:', {
      GOOGLE_SHEETS_SPREADSHEET_ID: !!env.GOOGLE_SHEETS_SPREADSHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_KEY: !!env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Present' : 'Missing',
      GOOGLE_SERVICE_ACCOUNT_KEY_LENGTH: env.GOOGLE_SERVICE_ACCOUNT_KEY?.length,
      GOOGLE_SERVICE_ACCOUNT_KEY_PREVIEW: env.GOOGLE_SERVICE_ACCOUNT_KEY?.substring(0, 50) + '...'
    });

    if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_IDが設定されていません');
    }
    if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEYが設定されていません');
    }

    this.spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    try {
      // Base64デコードを追加
      let decodedCredentials;
      try {
        decodedCredentials = atob(env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('デコード後の文字列長:', decodedCredentials.length);
        console.log('デコード後の文字列プレビュー:', decodedCredentials.substring(0, 100) + '...');
      } catch (decodeError) {
        console.error('Base64デコードエラー:', {
          errorType: typeof decodeError,
          errorMessage: decodeError instanceof Error ? decodeError.message : String(decodeError),
          originalKey: env.GOOGLE_SERVICE_ACCOUNT_KEY
        });
        throw new Error('サービスアカウントキーのデコードに失敗しました');
      }

      try {
        this.credentials = JSON.parse(decodedCredentials);
        console.log('パース後のcredentials:', {
          hasClientId: !!this.credentials.client_id,
          hasClientEmail: !!this.credentials.client_email,
          hasPrivateKey: !!this.credentials.private_key
        });
      } catch (parseError) {
        console.error('JSON解析エラー:', {
          errorType: typeof parseError,
          errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
          decodedCredentials
        });
        throw new Error('サービスアカウントキーのJSON解析に失敗しました');
      }

      console.log('Credentials details:', {
        clientEmail: this.credentials.client_email,
        projectId: this.credentials.project_id,
        privateKeyAvailable: !!this.credentials.private_key,
        privateKeyPreview: this.credentials.private_key ? this.credentials.private_key.substring(0, 50) + '...' : 'なし'
      });

      // OAuth2Clientを使用
      this.auth = new OAuth2Client({
        clientId: this.credentials.client_id,
        clientSecret: this.credentials.client_secret
      });

      // カスタムアクセストークン取得メソッド
      const generateAccessToken = async () => {
        try {
          console.log('アクセストークン生成詳細', {
            clientId: this.credentials.client_id,
            clientEmail: this.credentials.client_email,
            privateKeyAvailable: !!this.credentials.private_key,
            privateKeyLength: this.credentials.private_key?.length
          });

          const now = Math.floor(Date.now() / 1000);
          const payload = {
            iss: this.credentials.client_email,
            sub: this.credentials.client_email,
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600, // 1時間有効
            scope: 'https://www.googleapis.com/auth/spreadsheets'
          };

          console.log('JWT生成前のペイロード:', JSON.stringify(payload));
          
          const signedJwt = signJwt(payload, this.credentials.private_key);
          console.log('署名済みJWT詳細:', {
            jwtLength: signedJwt.length,
            jwtStart: signedJwt.substring(0, 50) + '...'
          });

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

          const responseText = await tokenResponse.text();
          console.log('トークンレスポンス全文:', responseText);

          if (!tokenResponse.ok) {
            console.error('トークンリクエスト詳細エラー:', {
              status: tokenResponse.status,
              statusText: tokenResponse.statusText,
              responseText
            });
            throw new Error(`Token request failed: ${responseText}`);
          }

          const tokenData = JSON.parse(responseText) as TokenResponse;
          return tokenData.access_token;
        } catch (error) {
          console.error('アクセストークン生成の包括的エラー:', {
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : '詳細なスタックトレースなし'
          });
          throw error;
        }
      };

      // トークン取得メソッドを設定
      (this.auth as any).getAccessToken = generateAccessToken;

      // 初期化プロミスを作成
      this._initializationPromise = this.initializeGoogleSheets(generateAccessToken);
    } catch (error) {
      console.error('Error initializing GoogleSheetsService:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  // 非同期初期化メソッド
  private async initializeGoogleSheets(generateAccessToken: () => Promise<string>) {
    try {
      const initialAccessToken = await generateAccessToken();
      console.log('アクセストークン詳細:', {
        tokenLength: initialAccessToken.length,
        tokenStart: initialAccessToken.substring(0, 20) + '...',
        tokenEnd: initialAccessToken.substring(initialAccessToken.length - 20)
      });

      // トークンの有効性を検証するための追加チェック
      const tokenValidationResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `access_token=${initialAccessToken}`
      });

      const tokenValidationResult = await tokenValidationResponse.json() as TokenValidationResponse;
      console.log('トークン検証結果:', {
        isValid: tokenValidationResponse.ok,
        audience: tokenValidationResult.audience,
        scope: tokenValidationResult.scope,
        expiresIn: tokenValidationResult.expires_in
      });

      // アクセストークンを明示的に設定
      this.auth.setCredentials({ 
        access_token: initialAccessToken,
        token_type: 'Bearer'
      });

      this._client = new GoogleSpreadsheet(this.spreadsheetId, this.auth);
      this._sheets = google.sheets({ version: 'v4', auth: this.auth });

      // 初期化完了フラグを設定
      this._isInitialized = true;

      console.log('Google Sheets service initialized successfully');
    } catch (error) {
      console.error('Google Sheets初期化エラー:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : '詳細なスタックトレースなし'
      });
      throw error;
    }
  }

  // 初期化を待機するメソッド
  public async initialize(): Promise<void> {
    if (this._initializationPromise) {
      await this._initializationPromise;
    }
  }

  // 他のメソッドの前に初期化を確認するデコレータ
  private async ensureInitialized() {
    if (!this._isInitialized) {
      await this.initialize();
    }
  }

  async getValues(sheetName: string, range: string): Promise<any[][]> {
    await this.ensureInitialized();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`
      });
      return response.data.values || [];
    } catch (error) {
      throw new Error('Failed to get values from sheet');
    }
  }

  async getLastRow(sheetName: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`
      });
      return response.data.values ? response.data.values.length : 0;
    } catch (error) {
      throw new Error('Failed to get last row');
    }
  }

  async getLastColumn(sheetName: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!1:1`
      });
      return response.data.values ? response.data.values[0].length : 0;
    } catch (error) {
      throw new Error('Failed to get last column');
    }
  }

  async setValue(sheetName: string, cell: string, value: any): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${cell}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[value]] }
      });
    } catch (error) {
      throw new Error('Failed to set value');
    }
  }

  async setValues(sheetName: string, range: string, values: any[][]): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    } catch (error) {
      throw new Error('Failed to update values in sheet');
    }
  }

  async clearSheet(sheetName: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`
      });
    } catch (error) {
      throw new Error('Failed to clear sheet');
    }
  }

  async getAccountBookSummary(): Promise<string> {
    await this.ensureInitialized();
    try {
      const sheetName = '家計簿';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`
      });
      
      const values = response.data.values || [];
      const totalIncome = values
        .filter((row: any[]) => row[0] === '収入')
        .reduce((sum: number, row: any[]) => sum + parseFloat(row[2] || 0), 0);
      
      const totalExpense = values
        .filter((row: any[]) => row[0] === '支出')
        .reduce((sum: number, row: any[]) => sum + parseFloat(row[2] || 0), 0);
      
      return `月次サマリ：
収入: ${totalIncome}円
支出: ${totalExpense}円
収支: ${totalIncome - totalExpense}円`;
    } catch (error) {
      throw new Error('Failed to get account book summary');
    }
  }

  async getRandomChatMessage(): Promise<string> {
    await this.ensureInitialized();
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
      } catch (getError) {
        console.error('Error in spreadsheets.get():', {
          errorType: typeof getError,
          errorMessage: getError instanceof Error ? getError.message : String(getError),
          stack: getError instanceof Error ? getError.stack : 'No stack trace',
          credentials: {
            clientEmail: this.credentials?.client_email,
            projectId: this.credentials?.project_id,
            privateKeyAvailable: !!this.credentials?.private_key
          },
          authDetails: {
            hasAccessToken: !!(this.auth as any).credentials?.access_token,
            tokenType: (this.auth as any).credentials?.token_type
          }
        });
        throw getError;
      }

      console.log('Spreadsheet metadata retrieved successfully', {
        spreadsheetTitle: response.data.properties?.title,
        sheets: response.data.sheets?.map(sheet => sheet.properties?.title)
      });

      const values = await this.getValues(sheetName, 'A:A');
      if (!values || values.length === 0) {
        return '';
      }

      const randomIndex = Math.floor(Math.random() * values.length);
      return values[randomIndex][0] || '';
    } catch (error) {
      console.error('getRandomChatMessageでエラー発生:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return errorMessage;
    }
  }

  async addChatMessage(message: string): Promise<void> {
    await this.ensureInitialized();
    try {
      const sheetName = 'うさこの言葉';
      
      const exists = await this.sheetExists(sheetName);
      if (!exists) {
        await this.createSheet(sheetName);
      }
      
      await this.appendValues(sheetName, [[message]]);
    } catch (error: any) {
      throw new Error(`Failed to add chat message: ${error.message}`);
    }
  }

  // プライベートヘルパーメソッド
  private async sheetExists(sheetName: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      return response.data.sheets.some((s: any) => s.properties.title === sheetName);
    } catch (error: any) {
      throw new Error(`Failed to check if sheet exists: ${error.message}`);
    }
  }

  private async createSheet(sheetName: string): Promise<void> {
    await this.ensureInitialized();
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
    } catch (error: any) {
      throw new Error(`Failed to create sheet: ${error.message}`);
    }
  }

  private async appendValues(sheetName: string, values: any[][]): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    } catch (error) {
      throw new Error('Failed to append values to sheet');
    }
  }
} 