import { GoogleSheetsService } from '../services/googleSheets';
import { LineMessagingService } from '../services/lineMessaging';

export class ChatHandler {
  private readonly sheetsService: GoogleSheetsService;
  private readonly lineService: LineMessagingService;
  private readonly imgUrl: string = 'https://example.com/chat.jpg'; // 実際の画像URLに置き換える

  constructor(lineService: LineMessagingService, sheetsService: GoogleSheetsService) {
    this.lineService = lineService;
    this.sheetsService = sheetsService;
  }

  /**
   * チュートリアルに表示するためのテンプレートに利用する配列を取得する
   */
  getTemplateColumn() {
    return {
      thumbnailImageUrl: this.imgUrl,
      title: 'うさことおしゃべり',
      text: '登録された言葉以外で話しかけると、私とおしゃべりできるよ♪',
      actions: [{
        type: 'message',
        label: 'おしゃべり！',
        text: 'うさこ〜〜〜'
      }]
    };
  }

  /**
   * メッセージを処理する
   */
  async handleMessage(message: string): Promise<string> {
    return await this.sheetsService.getRandomChatMessage();
  }
} 