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
          {
            thumbnailImageUrl: 'https://example.com/housework.jpg', // 実際の画像URLに置き換える
            imageAspectRatio: 'square',
            imageSize: 'contain',
            title: '家事管理',
            text: '家事管理だね。\n報告？それとも確認？',
            actions: [
              {
                type: 'postback',
                label: '報告する',
                data: JSON.stringify({ type: 'housework', action: 'report' })
              },
              {
                type: 'postback',
                label: '確認する',
                data: JSON.stringify({ type: 'housework', action: 'check' })
              }
            ]
          }
        );
        break;

      case '家計簿':
        console.log('家計簿コマンドを処理');
        // 家計簿のボタンテンプレートを返信
        await this.lineService.replyTemplateButton(
          replyToken,
          '家計簿テンプレート',
          {
            thumbnailImageUrl: 'https://example.com/accountbook.jpg', // 実際の画像URLに置き換える
            imageAspectRatio: 'square',
            imageSize: 'contain',
            title: '家計簿',
            text: '家計簿だね。\n報告？それとも確認？',
            actions: [
              {
                type: 'postback',
                label: '報告する',
                data: JSON.stringify({ type: 'accountBook', action: 'report' })
              },
              {
                type: 'postback',
                label: '確認する',
                data: JSON.stringify({ type: 'accountBook', action: 'check' })
              },
              {
                type: 'postback',
                label: '今月の支出',
                data: JSON.stringify({ type: 'accountBook', action: 'summary' })
              }
            ]
          }
        );
        break;

      case '買い物リスト':
        console.log('買い物リストコマンドを処理');
        // 買い物リストのボタンテンプレートを返信
        await this.lineService.replyTemplateButton(
          replyToken,
          '買い物リストテンプレート',
          {
            thumbnailImageUrl: 'https://example.com/purchase.jpg', // 実際の画像URLに置き換える
            imageAspectRatio: 'square',
            imageSize: 'contain',
            title: '買い物リスト',
            text: '買い物リストだね。\n何をする？',
            actions: [
              {
                type: 'postback',
                label: 'リストを見る',
                data: JSON.stringify({ type: 'purchase', action: 'list' })
              },
              {
                type: 'postback',
                label: '追加する',
                data: JSON.stringify({ type: 'purchase', action: 'add' })
              },
              {
                type: 'postback',
                label: '削除する',
                data: JSON.stringify({ type: 'purchase', action: 'delete' })
              }
            ]
          }
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
        if (/買い出し/.exec(text)) {
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