import { LineEvent, LineMessage } from './types/index';
import { LineService } from './services/line-service';
import { D1Repository } from './repositories/d1-repository';
import { MessageHandler } from './handlers/message-handler';
import { Env as BaseEnv } from './config/env';

export interface Env extends BaseEnv {
  // Cloudflare Workersの追加環境変数
  DB: D1Database;
  LOCAL_DB: D1Database;
  PROD_DB: D1Database;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // 環境変数の詳細なログ出力
    console.log('環境変数の詳細:', {
      envKeys: Object.keys(env),
      environment: env.ENVIRONMENT,
      databases: {
        DB: typeof env.DB,
        LOCAL_DB: typeof env.LOCAL_DB,
        PROD_DB: typeof env.PROD_DB
      },
      lineChannelSecret: env.LINE_CHANNEL_SECRET ? '✓ 設定済み' : '✗ 未設定'
    });

    // 環境変数の確認とデフォルト値設定
    const environment = env.ENVIRONMENT || 'development';
    console.log('環境:', environment);

    // 環境の判定
    const isProduction = environment === 'production';
    console.log('環境タイプ:', isProduction ? '本番' : '開発');

    // データベースの選択と詳細なログ
    const db = isProduction ? env.PROD_DB : env.LOCAL_DB;
    console.log('データベース選択:', {
      isProduction,
      selectedDb: isProduction ? 'PROD_DB' : 'LOCAL_DB',
      dbType: typeof db,
      dbKeys: Object.keys(db),
      dbToString: db.toString()
    });

    // データベースの存在確認
    if (!db) {
      console.error('データベースが見つかりません', { 
        env, 
        keys: Object.keys(env),
        PROD_DB: env.PROD_DB,
        LOCAL_DB: env.LOCAL_DB
      });
      return new Response('Database not configured', { status: 500 });
    }

    // より詳細なデバッグログ
    console.log('=== Webhook Request ===');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    
    // ヘッダーのログ出力を修正
    const headersLog: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersLog[key] = value;
    });
    console.log('Headers:', JSON.stringify(headersLog, null, 2));

    // CORSとプリフライトリクエストの処理
    if (request.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature'
        }
      });
    }

    // Webhookエンドポイントのみ許可（開発時は緩和）
    if (request.method !== 'POST') {
      console.warn('Invalid request method:', request.method);
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      // リクエストボディの読み取り
      const rawBody = await request.text();
      console.log('Request body:', rawBody);

      // 署名検証
      const signature = request.headers.get('X-Line-Signature') || '';
      console.log('Signature:', signature);

      // 本番環境以外では署名検証をスキップ
      const isValidSignature = isProduction ? await verifyLineSignature(
        rawBody, 
        signature,
        env
      ) : true;

      if (!isValidSignature) {
        console.warn('署名検証に失敗しました');
        return new Response('Unauthorized', { status: 401 });
      }

      // JSONパース（エラーハンドリング付き）
      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        return new Response('Invalid JSON', { status: 400 });
      }

      // イベントの存在確認
      const events: LineEvent[] = payload.events || [];
      console.log('Events:', JSON.stringify(events, null, 2));

      // サービスの初期化
      const lineService = new LineService(env.LINE_CHANNEL_ACCESS_TOKEN, !isProduction);
      const d1Repository = new D1Repository(db);
      const messageHandler = new MessageHandler(lineService, d1Repository);

      // イベント処理
      const responsePromises = events.map(async (event) => {
        try {
          console.log('Processing event:', JSON.stringify(event, null, 2));
          
          // メッセージイベントの処理
          if (event.type === 'message' && event.message.type === 'text') {
            // replyTokenのデバッグログ
            console.log('ReplyToken:', event.replyToken);

            const response = await messageHandler.handleMessage(event);
            
            // レスポンスがある場合は返信
            if (response && event.replyToken) {
              console.log('Sending reply:', JSON.stringify(response, null, 2));
              try {
                await lineService.replyMessage(event.replyToken, response);
              } catch (replyError) {
                console.error('メッセージ返信エラー:', {
                  replyToken: event.replyToken,
                  response,
                  error: replyError
                });
              }
            }
          }
        } catch (handlerError) {
          console.error('イベント処理中にエラー発生:', handlerError);
        }
      });

      // すべてのイベント処理を待機
      await Promise.all(responsePromises);

      return new Response('OK', { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('致命的なエラー:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

// 署名検証関数を更新
async function verifyLineSignature(
  rawBody: string, 
  signature: string, 
  env: Env
): Promise<boolean> {
  if (!env.LINE_CHANNEL_SECRET) {
    console.error('LINE Channel Secret が設定されていません');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.LINE_CHANNEL_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(rawBody)
    );

    const computedSignature = btoa(String.fromCharCode.apply(null, [...new Uint8Array(signatureBuffer)]));
    
    return computedSignature === signature;
  } catch (error) {
    console.error('署名検証中にエラーが発生:', error);
    return false;
  }
}
