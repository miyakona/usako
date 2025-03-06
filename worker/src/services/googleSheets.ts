import { Env } from '../types';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export class GoogleSheetsService {
  private spreadsheetId: string;
  private sheets: any;

  constructor(env: Env) {
    this.spreadsheetId = env.SPREADSHEET_ID;
    const auth = new JWT({
      email: JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY).client_email,
      key: JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY).private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  /**
   * シートから値を取得する
   */
  async getValues(sheetName: string, range: string): Promise<any[][]> {
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

  /**
   * シートの値を更新する
   */
  async setValues(sheetName: string, range: string, values: any[][]): Promise<void> {
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

  /**
   * シートに値を追加する
   */
  async appendValues(sheetName: string, values: any[][]): Promise<void> {
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

  /**
   * シートから行を削除する
   */
  async deleteRows(sheetName: string, startIndex: number, endIndex: number): Promise<void> {
    try {
      const sheetId = await this.getSheetId(sheetName);
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex,
                endIndex
              }
            }
          }]
        }
      });
    } catch (error) {
      throw new Error('Failed to delete rows from sheet');
    }
  }

  /**
   * シートIDを取得する
   */
  private async getSheetId(sheetName: string): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      const sheet = response.data.sheets.find((s: any) => s.properties.title === sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      return sheet.properties.sheetId;
    } catch (error: any) {
      throw new Error(`Failed to get sheet ID: ${error.message}`);
    }
  }

  /**
   * シートが存在するか確認する
   */
  async sheetExists(sheetName: string): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      return response.data.sheets.some((s: any) => s.properties.title === sheetName);
    } catch (error: any) {
      throw new Error(`Failed to check if sheet exists: ${error.message}`);
    }
  }

  /**
   * 新しいシートを作成する
   */
  async createSheet(sheetName: string): Promise<void> {
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

  /**
   * シートを初期化する（存在しない場合は作成し、ヘッダー行を設定する）
   */
  async initializeSheet(sheetName: string, headers: string[]): Promise<void> {
    try {
      // シートが存在するか確認
      const exists = await this.sheetExists(sheetName);
      
      // 存在しない場合は作成
      if (!exists) {
        await this.createSheet(sheetName);
      }
      
      // ヘッダー行を設定
      await this.setValues(sheetName, 'A1', [headers]);
      
      // 列の幅を調整
      const sheetId = await this.getSheetId(sheetName);
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: headers.map((_, index) => ({
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: index,
                endIndex: index + 1
              },
              properties: {
                pixelSize: 150
              },
              fields: 'pixelSize'
            }
          }))
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to initialize sheet: ${error.message}`);
    }
  }

  /**
   * 買い物リストのシートを初期化する
   */
  async initializePurchaseListSheet(): Promise<void> {
    await this.initializeSheet('買い出しリスト', ['品目', 'ステータス']);
  }
} 