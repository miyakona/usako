import { Env, LineEvent, LineWebhookRequest } from './types';
import { MessageHandler } from './handlers/messageHandler';
import { PostbackHandler } from './handlers/postbackHandler';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORSヘッダーを設定
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // POSTリクエスト以外は404を返す
    if (request.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // リクエストボディを取得
      const body = await request.text();
      
      // LINE署名を検証
      const signature = request.headers.get('X-Line-Signature');
      if (!signature) {
        return new Response('Signature Required', { status: 401 });
      }
      
      const isValid = await verifySignature(body, signature, env.LINE_CHANNEL_SECRET);
      if (!isValid) {
        return new Response('Invalid Signature', { status: 401 });
      }

      // リクエストボディをJSONとしてパース
      const webhookRequest = JSON.parse(body) as LineWebhookRequest;
      
      // 各イベントを処理
      const messageHandler = new MessageHandler(env);
      const postbackHandler = new PostbackHandler(env);
      
      for (const event of webhookRequest.events) {
        await handleEvent(event, messageHandler, postbackHandler);
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

/**
 * LINEの署名を検証する
 */
async function verifySignature(body: string, signature: string, channelSecret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = encoder.encode(channelSecret);
  const data = encoder.encode(body);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const result = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const expectedSignature = Array.from(new Uint8Array(result))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
}

/**
 * LINEイベントを処理する
 */
async function handleEvent(
  event: LineEvent,
  messageHandler: MessageHandler,
  postbackHandler: PostbackHandler
): Promise<void> {
  const { type, replyToken, source } = event;
  
  if (!replyToken) return;
  
  try {
    switch (type) {
      case 'message':
        if (event.message?.type === 'text' && event.message.text) {
          await messageHandler.handleMessage(replyToken, event.message.text, source?.userId);
        }
        break;
        
      case 'postback':
        if (event.postback?.data) {
          await postbackHandler.handlePostback(replyToken, event.postback.data, source.userId);
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${type}`);
        break;
    }
  } catch (error) {
    console.error(`Error handling ${type} event:`, error);
  }
} 