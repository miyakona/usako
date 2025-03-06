import { Env } from '../types';
import { LineMessagingService } from '../services/lineMessaging';
import { GoogleSheetsService } from '../services/googleSheets';

export class PostbackHandler {
  private lineService: LineMessagingService;
  private sheetsService: GoogleSheetsService;

  constructor(env: Env) {
    this.lineService = new LineMessagingService(env);
    this.sheetsService = new GoogleSheetsService(env);
  }

  /**
   * ポストバックを処理する
   */
  async handlePostback(replyToken: string, data: string, userId: string): Promise<void> {
    console.log('Handling postback:', data);
    
    try {
      const parsedData = JSON.parse(data);
      let text = '';
      
      switch(parsedData.type) {
        case 'housework':
          text = await this.handleHouseworkPostback(parsedData.action, userId);
          break;
          
        case 'accountBook':
          text = await this.handleAccountBookPostback(parsedData.action);
          break;
          
        default:
          text = 'エラー。意図しないアクションが指定されました。';
          break;
      }
      
      await this.lineService.replyText(replyToken, text);
    } catch (error) {
      console.error('Error handling postback:', error);
      await this.lineService.replyText(replyToken, 'エラーが発生しました。もう一度お試しください。');
    }
  }

  /**
   * 家事管理のポストバックを処理する
   */
  private async handleHouseworkPostback(action: string, userId: string): Promise<string> {
    switch(action) {
      case 'report':
        return '家事の報告だね！\nhttps://example.com/housework-form'; // 実際のフォームURLに置き換える
        
      case 'check':
        return await this.getHouseworkStatus(userId);
        
      default:
        return 'エラー。意図しないアクションが指定されました。';
    }
  }

  /**
   * 家計簿のポストバックを処理する
   */
  private async handleAccountBookPostback(action: string): Promise<string> {
    const dt = new Date();
    let year = dt.getFullYear();
    let month = dt.getMonth() + 1;

    if (dt.getDate() >= 26) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    const remindComment = '出費は毎月25日までに報告してね！26日に支払い金額を通知するよ！';
    
    switch(action) {
      case 'report':
        return `家計の報告だね！\nhttps://example.com/accountbook-form?year=${year}&month=${String(month).padStart(2, '0')}`; // 実際のフォームURLに置き換える
        
      case 'check':
        return await this.getAccountBookStatus();
        
      case 'summary':
        return await this.getAccountBookSummary();
        
      default:
        return 'エラー。意図しないアクションが指定されました。';
    }
  }

  /**
   * 家事の状況を取得する
   */
  private async getHouseworkStatus(userId: string): Promise<string> {
    try {
      // 実際の実装では、Google Sheetsから家事の状況を取得する
      return '今日はまだ家事をやってないみたい。\n報告するときは、「フォーム」って話しかけてね！';
    } catch (error) {
      console.error('Error getting housework status:', error);
      return 'エラーが発生しました。もう一度お試しください。';
    }
  }

  /**
   * 家計簿の状況を取得する
   */
  private async getAccountBookStatus(): Promise<string> {
    try {
      // 実際の実装では、Google Sheetsから家計簿の状況を取得する
      return '報告済の支出はないみたい。';
    } catch (error) {
      console.error('Error getting account book status:', error);
      return 'エラーが発生しました。もう一度お試しください。';
    }
  }

  /**
   * 家計簿のサマリを取得する
   */
  private async getAccountBookSummary(): Promise<string> {
    try {
      // 実際の実装では、Google Sheetsから家計簿のサマリを取得する
      return '現時点での支払内容はこんな感じだよ！\n\n食費: 10000円\n日用品: 5000円\n\n毎月と比較してどうかな？';
    } catch (error) {
      console.error('Error getting account book summary:', error);
      return 'エラーが発生しました。もう一度お試しください。';
    }
  }
} 