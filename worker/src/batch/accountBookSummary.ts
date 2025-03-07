import { Env } from '../types';
import { LineMessagingService } from '../services/lineMessaging';
import { GoogleSheetsService } from '../services/googleSheets';
import { CommandBaseHandler } from '../handlers/commandBaseHandler';

export class AccountBookSummaryHandler extends CommandBaseHandler {
  private readonly sheetsService: GoogleSheetsService;

  constructor(
    env: Env, 
    lineService?: LineMessagingService,
    sheetsService?: GoogleSheetsService
  ) {
    super(env, lineService);
    this.sheetsService = sheetsService || new GoogleSheetsService(env);
  }

  /**
   * 実行メソッド
   */
  protected async run(): Promise<void> {
    try {
      // 月次の支出サマリを取得
      const monthlySummary = await this.sheetsService.getAccountBookSummary();
      
      // サマリをLINEで通知
      await this.lineService.pushAll(monthlySummary);
    } catch (error) {
      // エラー時の処理
      await this.handleError('出費のサマリ通知バッチ', error as Error);
    }
  }

  /**
   * handleMessageメソッドの実装（バッチ処理では使用しない）
   */
  public async handleMessage(
    replyToken: string, 
    message: string, 
    userId?: string
  ): Promise<void> {
    // バッチ処理のため、このメソッドは使用されない
    throw new Error('Not implemented');
  }

  /**
   * エラーハンドリング
   */
  protected async handleError(context: string, error: Error): Promise<void> {
    const errorMessage = `${context}の実行に失敗しました。
エラーメッセージ: ${error.message}

スタックトレース:
${error.stack || ''}`;

    console.error(errorMessage);
    await this.lineService.pushAll(errorMessage);
  }
} 