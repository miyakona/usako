import { Env, LineMessage, LineAction, LineColumn } from '../types';

export class LineMessagingService {
  private channelAccessToken: string;

  constructor(env: Env) {
    this.channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
  }

  /**
   * テキストメッセージを返信する
   */
  async replyText(replyToken: string, text: string): Promise<void> {
    const message: LineMessage = {
      type: 'text',
      text: text
    };
    
    await this.reply(replyToken, [message]);
  }

  /**
   * ボタンテンプレートを返信する
   */
  async replyTemplateButton(
    replyToken: string, 
    altText: string, 
    thumbnailImageUrl: string, 
    imageAspectRatio: 'rectangle' | 'square', 
    imageSize: 'cover' | 'contain', 
    title: string, 
    text: string, 
    actions: LineAction[]
  ): Promise<void> {
    const message: LineMessage = {
      type: 'template',
      altText: altText,
      template: {
        type: 'buttons',
        thumbnailImageUrl: thumbnailImageUrl,
        imageAspectRatio: imageAspectRatio,
        imageSize: imageSize,
        title: title,
        text: text,
        actions: actions
      }
    };
    
    await this.reply(replyToken, [message]);
  }

  /**
   * カルーセルテンプレートを返信する
   */
  async replyTemplateCarousel(replyToken: string, columns: LineColumn[]): Promise<void> {
    const message: LineMessage = {
      type: 'template',
      altText: 'カルーセルテンプレート',
      template: {
        type: 'carousel',
        columns: columns
      }
    };
    
    await this.reply(replyToken, [message]);
  }

  /**
   * メッセージを返信する
   */
  private async reply(replyToken: string, messages: LineMessage[]): Promise<void> {
    const postData = {
      replyToken: replyToken,
      messages: messages
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.channelAccessToken}`
      },
      body: JSON.stringify(postData)
    };
    
    const response = await fetch('https://api.line.me/v2/bot/message/reply', options);
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }

  /**
   * メッセージをプッシュする
   */
  async push(text: string, to: string): Promise<void> {
    const message: LineMessage = {
      type: 'text',
      text: text
    };

    const postData = {
      to: to,
      messages: [message]
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.channelAccessToken}`
      },
      body: JSON.stringify(postData)
    };
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', options);
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }

  /**
   * 全ユーザーにメッセージをプッシュする
   */
  async pushAll(text: string): Promise<void> {
    // 実際の実装では、ユーザーIDのリストを取得して各ユーザーにプッシュする必要があります
    // この例では簡略化のため、特定のユーザーIDを環境変数から取得することを想定しています
    console.log('Push to all users:', text);
  }
} 