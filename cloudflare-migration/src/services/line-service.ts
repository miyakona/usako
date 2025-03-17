import { LineMessage, LineEvent, LineMessageEvent, LinePostbackEvent } from '../types/index';

// LINE APIのエンドポイント
const LINE_API_BASE_URL = 'https://api.line.me/v2/bot';

// エラーレスポンスの型定義
interface LineApiErrorResponse {
  message: string;
  details?: any[];
}

export class LineService {
  private readonly LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

  constructor(private channelAccessToken: string, private isLocal: boolean = false) {}

  // 共通のヘッダーを生成
  private getHeaders(): Headers {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${this.channelAccessToken}`);
    return headers;
  }

  // エラーハンドリング
  private async handleApiResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LINE API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });

      throw new Error(`LINE API Error: ${response.status} - ${errorBody}`);
    }
    return response.json().catch(() => ({}));
  }

  // メッセージ返信
  async replyMessage(replyToken: string, messages: LineMessage | LineMessage[]): Promise<any> {
    console.log('📨 replyMessage呼び出し:', {
      replyToken,
      messagesCount: Array.isArray(messages) ? messages.length : 1,
      channelAccessToken: this.channelAccessToken ? '✓ 存在' : '✗ 未設定',
      isLocal: this.isLocal
    });

    // ローカル環境では LINE API リクエストをスキップ
    if (this.isLocal) {
      console.log('🏠 ローカル環境のため、LINE API リクエストをスキップ');
      console.log('📤 スキップされたメッセージ:', JSON.stringify({
        replyToken,
        messages: Array.isArray(messages) ? messages : [messages]
      }, null, 2));
      return { 
        status: 'skipped', 
        message: 'Skipped in local environment' 
      };
    }

    // メッセージが単一の場合は配列に変換
    const messageArray = Array.isArray(messages) ? messages : [messages];

    const payload = {
      replyToken,
      messages: messageArray
    };

    console.log('📦 リクエストペイロード:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(this.LINE_REPLY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.channelAccessToken}`
        },
        body: JSON.stringify(payload)
      });

      console.log('🌐 LINE API レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });

      // レスポンスボディをログ出力
      const responseBody = await response.text();
      console.log('📄 レスポンスボディ:', responseBody);

      // レスポンスの処理
      if (!response.ok) {
        console.error('❌ LINE API エラー:', {
          status: response.status,
          body: responseBody
        });
        throw new Error(`LINE API Error: ${response.status} - ${responseBody}`);
      }

      return JSON.parse(responseBody);
    } catch (error) {
      console.error('❌ メッセージ返信エラー:', error);
      throw error;
    }
  }

  // メッセージプッシュ
  async pushMessage(to: string, messages: LineMessage | LineMessage[]): Promise<any> {
    // メッセージが単一の場合は配列に変換
    const messageArray = Array.isArray(messages) ? messages : [messages];

    const payload = {
      to,
      messages: messageArray
    };

    try {
      const response = await fetch(`${LINE_API_BASE_URL}/message/push`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      return this.handleApiResponse(response);
    } catch (error) {
      console.error('メッセージプッシュエラー:', error);
      throw error;
    }
  }

  // プロフィール取得
  async getProfile(userId: string): Promise<any> {
    try {
      const response = await fetch(`${LINE_API_BASE_URL}/profile/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return this.handleApiResponse(response);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
  }

  // グループまたはルームから退出
  async leaveGroupOrRoom(id: string, isGroup: boolean = true): Promise<any> {
    const endpoint = isGroup 
      ? `${LINE_API_BASE_URL}/group/${id}/leave`
      : `${LINE_API_BASE_URL}/room/${id}/leave`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return this.handleApiResponse(response);
    } catch (error) {
      console.error('グループ/ルーム退出エラー:', error);
      throw error;
    }
  }

  // イベントタイプに基づいたメッセージ処理
  async handleEvent(event: LineEvent): Promise<any> {
    switch (event.type) {
      case 'message':
        return this.handleMessageEvent(event);
      case 'postback':
        return this.handlePostbackEvent(event);
      default:
        console.warn(`未対応のイベントタイプ: ${event.type}`);
        return null;
    }
  }

  // メッセージイベントのハンドラ
  private async handleMessageEvent(event: LineMessageEvent): Promise<any> {
    console.log('メッセージイベント:', event);
    
    // メッセージタイプに応じた処理
    switch (event.message.type) {
      case 'text':
        return this.handleTextMessage(event);
      case 'image':
        return this.handleImageMessage(event);
      case 'sticker':
        return this.handleStickerMessage(event);
      default:
        console.warn(`未対応のメッセージタイプ: ${event.message.type}`);
        return null;
    }
  }

  // テキストメッセージの処理
  private async handleTextMessage(event: LineMessageEvent): Promise<LineMessage | null> {
    const text = event.message.text || '';
    const userId = event.source.userId;

    console.log(`テキストメッセージ受信: ${text} from ${userId}`);

    // 簡単な応答例
    if (text.includes('こんにちは')) {
      return {
        type: 'text',
        text: `こんにちは！${userId}さん`      };
    }

    return null;
  }

  // 画像メッセージの処理
  private async handleImageMessage(event: LineMessageEvent): Promise<LineMessage | null> {
    console.log('画像メッセージ受信:', event.message);
    return null;
  }

  // スタンプメッセージの処理
  private async handleStickerMessage(event: LineMessageEvent): Promise<LineMessage | null> {
    console.log('スタンプメッセージ受信:', event.message);
    return null;
  }

  // ポストバックイベントのハンドラ
  private async handlePostbackEvent(event: LinePostbackEvent): Promise<LineMessage | null> {
    console.log('ポストバックイベント:', event);
    
    const data = event.postback.data;
    const userId = event.source.userId;

    console.log(`ポストバックデータ: ${data} from ${userId}`);

    // データに応じた処理
    if (data === 'action=select') {
      return {
        type: 'text',
        text: `選択されたアクション: ${data}`
      };
    }

    return null;
  }
} 
