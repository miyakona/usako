import { Env } from '../types';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as nodeCrypto from 'crypto';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export interface GoogleSheetsService {
  /**
   * シートの値を取得する
   * @param sheet シート
   * @param range 範囲
   * @param column オプションの列番号
   * @returns 値の配列
   */
  getValues(sheet: any, range: string, column?: number): Promise<any[]>;

  /**
   * シートの最終行を取得する
   * @param sheet シート
   * @returns 最終行番号
   */
  getLastRow(sheet: any): Promise<number>;

  /**
   * シートの最終列を取得する
   * @param sheet シート
   * @returns 最終列番号
   */
  getLastColumn(sheet: any): Promise<number>;

  /**
   * シートの値を設定する
   * @param sheet シート
   * @param cell セル
   * @param value 値
   */
  setValue(sheet: any, cell: string, value: any): Promise<void>;

  /**
   * シートの値を設定する（複数セル）
   * @param sheet シート
   * @param range 範囲
   * @param values 値の配列
   */
  setValues(sheet: any, range: string, values: any[][]): Promise<void>;

  /**
   * シートをクリアする
   * @param sheet シート
   */
  clearSheet(sheet: any): Promise<void>;

  /**
   * 月次の家計簿サマリを取得する
   * @returns 月次サマリ文字列
   */
  getAccountBookSummary(): Promise<string>;
}

export class GoogleSheetsService {
  private readonly spreadsheetId: string;
  private readonly sheets: any;
  private readonly client: GoogleSpreadsheet;

  constructor(env: Env) {
    if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_IDが設定されていません');
    }
    if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEYが設定されていません');
    }

    this.spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.client = new GoogleSpreadsheet(this.spreadsheetId, auth);
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

  /**
   * チャットメッセージをランダムに取得する
   */
  async getRandomChatMessage(): Promise<string> {
    try {
      const sheetName = 'うさこの言葉';
      
      // シートが存在するか確認し、なければ作成
      const exists = await this.sheetExists(sheetName);
      if (!exists) {
        await this.createSheet(sheetName);
        await this.setValues(sheetName, 'A1', [['こんにちは！']]);
      }
      
      // メッセージを取得
      const messages = await this.getValues(sheetName, 'A:A');
      if (!messages || messages.length === 0) {
        return 'こんにちは！';
      }
      
      // Node.jsのcryptoモジュールを使用して安全な乱数を生成
      let randomValue: number;
      try {
        // まず、ブラウザ環境のcrypto.getRandomValuesを試す
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        randomValue = randomArray[0] / 0xffffffff;
      } catch (e) {
        // ブラウザ環境のcryptoが使えない場合はNode.jsのcryptoを使用
        randomValue = nodeCrypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
      }
      
      // ランダムにメッセージを選択
      const randomIndex = Math.floor(randomValue * messages.length);
      return messages[randomIndex][0] || 'こんにちは！';
    } catch (error: any) {
      console.error('Failed to get random chat message:', error);
      return 'こんにちは！';
    }
  }

  /**
   * チャットメッセージを追加する
   */
  async addChatMessage(message: string): Promise<void> {
    try {
      const sheetName = 'うさこの言葉';
      
      // シートが存在するか確認し、なければ作成
      const exists = await this.sheetExists(sheetName);
      if (!exists) {
        await this.createSheet(sheetName);
      }
      
      // メッセージを追加
      await this.appendValues(sheetName, [[message]]);
    } catch (error: any) {
      throw new Error(`Failed to add chat message: ${error.message}`);
    }
  }

  /**
   * 月次の家計簿サマリを取得する
   * @returns 月次サマリ文字列
   */
  async getAccountBookSummary(): Promise<string> {
    try {
      // 家計簿シートから月次サマリを取得
      const sheetName = '家計簿';
      const range = 'A:Z'; // 必要に応じて適切な範囲に調整

      // 月次サマリを取得するロジックを実装
      const values = await this.getValues(sheetName, range);
      
      // サマリの生成ロジック（仮の実装）
      const totalExpenses = this.calculateTotalExpenses(values);
      const categorySummary = this.generateCategorySummary(values);

      return `今月の支出サマリ：
総支出: ${totalExpenses}円

${categorySummary}`;
    } catch (error) {
      console.error('月次サマリの取得に失敗しました:', error);
      throw new Error('月次サマリの取得に失敗しました');
    }
  }

  /**
   * 支出の合計を計算する（仮の実装）
   */
  private calculateTotalExpenses(values: any[][]): number {
    // 実際の実装では、適切な列から支出を計算
    return values.slice(1).reduce((total, row) => {
      const expense = parseFloat(row[2] || 0); // 3列目が支出と仮定
      return total + expense;
    }, 0);
  }

  /**
   * カテゴリ別の支出サマリを生成する（仮の実装）
   */
  private generateCategorySummary(values: any[][]): string {
    const categories: { [key: string]: number } = {};

    // 実際の実装では、適切な列からカテゴリと支出を取得
    values.slice(1).forEach(row => {
      const category = row[1] || '未分類'; // 2列目がカテゴリと仮定
      const expense = parseFloat(row[2] || 0); // 3列目が支出と仮定
      
      categories[category] = (categories[category] || 0) + expense;
    });

    return Object.entries(categories)
      .map(([category, amount]) => `${category}: ${amount}円`)
      .join('\n');
  }
} 