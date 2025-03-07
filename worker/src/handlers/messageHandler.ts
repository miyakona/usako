import { Env } from '../types';
import { LineMessagingService } from '../services/lineMessaging';
import { GoogleSheetsService } from '../services/googleSheets';
import { PurchaseHandler } from './purchaseHandler';
import { ChatHandler } from './chatHandler';

export class MessageHandler {
  private readonly lineService: LineMessagingService;
  private readonly sheetsService: GoogleSheetsService;
  private readonly purchaseHandler: PurchaseHandler;
  private readonly chatHandler: ChatHandler;

  constructor(env: Env) {
    this.lineService = new LineMessagingService(env);
    this.sheetsService = new GoogleSheetsService(env);
    this.purchaseHandler = new PurchaseHandler(this.sheetsService, this.lineService);
    this.chatHandler = new ChatHandler(this.sheetsService, this.lineService);
  }

  /**
   * メッセージを処理する
   */
  async handleMessage(replyToken: string, text: string, _userId?: string): Promise<void> {
    console.log('Handling message:', text);

    // コマンド系
    switch(text) {
      case '家事管理':
        console.log('家事管理コマンドを処理');
        // 家事管理のボタンテンプレートを返信
        await this.lineService.replyTemplateButton(
          replyToken,
          '家事管理テンプレート',
          'https://example.com/housework.jpg', // 実際の画像URLに置き換える
          'square',
          'contain',
          '家事管理',
          '家事管理だね。\n報告？それとも確認？',
          [
            {
              type: 'postback',
              label: '家事を報告する',
              data: '{"type":"housework", "action":"report"}'
            },
            {
              type: 'postback',
              label: '家事の状況を確認する',
              data: '{"type":"housework", "action":"check"}'
            }
          ]
        );
        break;

      case '家計簿':
        console.log('家計簿コマンドを処理');
        // 家計簿のボタンテンプレートを返信
        await this.lineService.replyTemplateButton(
          replyToken,
          '家計管理テンプレート',
          'https://example.com/accountbook.jpg', // 実際の画像URLに置き換える
          'square',
          'contain',
          '家計簿',
          '家計管理だね。\n報告？それとも確認？',
          [
            {
              type: 'postback',
              label: '出費を書き込む',
              data: '{"type":"accountBook", "action":"report"}'
            },
            {
              type: 'postback',
              label: '報告済の支出を確認する',
              data: '{"type":"accountBook", "action":"check"}'
            }
          ]
        );
        break;

      case '買い物リスト':
        console.log('買い物リストコマンドを処理');
        // 買い物リストのボタンテンプレートを返信
        await this.lineService.replyTemplateButton(
          replyToken,
          '買い物リスト管理',
          'https://example.com/shopping.jpg', // 実際の画像URLに置き換える
          'square',
          'contain',
          '買い物リスト',
          '買い物リストだね。\n何をする？',
          [
            {
              type: 'postback',
              label: 'リストを確認する',
              data: '{"type":"purchase", "action":"list"}'
            },
            {
              type: 'postback',
              label: '品目を追加する',
              data: '{"type":"purchase", "action":"add"}'
            },
            {
              type: 'postback',
              label: '品目を削除する',
              data: '{"type":"purchase", "action":"delete"}'
            }
          ]
        );
        break;

      case 'チュートリアル':
        console.log('チュートリアルコマンドを処理');
        // チュートリアルのカルーセルテンプレートを返信
        await this.lineService.replyTemplateCarousel(
          replyToken,
          [
            {
              thumbnailImageUrl: 'https://example.com/housework.jpg',
              title: '家事管理',
              text: '家事の報告と、報告内容の確認ができるよ',
              actions: [{
                type: 'message',
                label: '使ってみる',
                text: '家事管理'
              }]
            },
            {
              thumbnailImageUrl: 'https://example.com/accountbook.jpg',
              title: '家計簿管理',
              text: '生活費の報告と、報告内容の確認ができるよ',
              actions: [{
                type: 'message',
                label: '使ってみる',
                text: '家計簿'
              }]
            },
            this.purchaseHandler.getTemplateColumn(),
            this.chatHandler.getTemplateColumn()
          ]
        );
        break;

      default:
        // 買い出しリストの処理
        if (text.match(/買い出し/)) {
          console.log('買い出しリストコマンドを処理');
          const response = await this.purchaseHandler.handleMessage(text);
          await this.lineService.replyText(replyToken, response);
        } else if (text.includes('うさこ') || text.includes('うさこ〜〜〜')) {
          // チャット機能の処理
          console.log('チャットコマンドを処理');
          const response = await this.chatHandler.handleMessage(text);
          await this.lineService.replyText(replyToken, response);
        } else {
          // デフォルトの応答
          await this.lineService.replyText(replyToken, 'こんにちは！何かお手伝いできることはありますか？');
        }
        break;
    }
  }
} 