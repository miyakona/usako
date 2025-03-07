import { Env } from '../types';
import { LineMessagingService } from '../services/lineMessaging';
import { GoogleSheetsService } from '../services/googleSheets';
import { PurchaseHandler } from './purchaseHandler';

export class PostbackHandler {
  private readonly lineService: LineMessagingService;
  private readonly sheetsService: GoogleSheetsService;
  private readonly purchaseHandler: PurchaseHandler;

  constructor(env: Env) {
    this.lineService = new LineMessagingService(env);
    this.sheetsService = new GoogleSheetsService(env);
    this.purchaseHandler = new PurchaseHandler(this.sheetsService, this.lineService);
    
    // 初期化処理を実行
    this.initialize();
  }

  /**
   * 初期化処理
   */
  private initialize(): void {
    // 非同期処理だが、エラーハンドリングは内部で行われるため、awaitしない
    this.purchaseHandler.initialize();
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
          
        case 'purchase':
          text = await this.handlePurchasePostback(parsedData.action);
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

    // 変数を宣言するだけで使用していないため、コメントアウトまたは削除
    // const remindComment = '出費は毎月25日までに報告してね！26日に支払い金額を通知するよ！';
    
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
  private async getHouseworkStatus(_userId: string): Promise<string> {
    try {
      // 実際の実装では、Google Sheetsから家事の状況を取得する
      const message = '今日はまだ家事をやってないみたい。\n報告するときは、「フォーム」って話しかけてね！';
      return message;
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
      const message = '報告済の支出はないみたい。';
      return message;
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
      const message = '現時点での支払内容はこんな感じだよ！\n\n食費: 10000円\n日用品: 5000円\n\n毎月と比較してどうかな？';
      return message;
    } catch (error) {
      console.error('Error getting account book summary:', error);
      return 'エラーが発生しました。もう一度お試しください。';
    }
  }

  /**
   * 買い物リストのポストバックを処理する
   */
  private async handlePurchasePostback(action: string): Promise<string> {
    switch(action) {
      case 'list':
        return await this.purchaseHandler.handleMessage('買い出し\nリスト');
      case 'add':
        return '品目を追加するには、以下のフォーマットで送信してください：\n\n買い出し\n[品目1]\n[品目2]\n...\n欲しい';
      case 'delete':
        return '品目を削除するには、以下のフォーマットで送信してください：\n\n買い出し\n[品目1]\n[品目2]\n...\n買ったよ';
      default:
        return 'エラー。意図しないアクションが指定されました。';
    }
  }
} 