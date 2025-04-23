import { IncomingMessage, ServerResponse } from "http";
import { Env, D1Database, LineRequestBody, LineResponseBody } from "./types";
import {
  getRandomMessageFromDB,
  formatErrorMessage,
  createLineResponse,
  safeJsonParse,
  sendResponse,
  createCloudflareResponse,
  safeOperation,
  sendLineReply,
} from "./utils";
import { CONTENT_TYPE, ERROR, LINE } from "./constants";

/**
 * GETリクエストのハンドラー
 * @param res レスポンスオブジェクト
 */
export const handleGetRequest = (res: ServerResponse): void => {
  sendResponse(res, 200, "Hello World!", CONTENT_TYPE.TEXT);
};

// ログ出力用のヘルパー関数
const logRequest = (
  method: string,
  url: string,
  headers: Headers,
  body?: any
): void => {
  console.log(`[REQUEST] ${method} ${url}`);
  console.log(
    `[HEADERS] ${JSON.stringify(Object.fromEntries(headers.entries()))}`
  );
  if (body) {
    console.log(
      `[BODY] ${typeof body === "string" ? body : JSON.stringify(body)}`
    );
  }
};

/**
 * LINEイベントからレスポンスを生成する共通関数
 * @param body LINEリクエストボディ
 * @param db D1データベース
 * @returns LINE Messaging API形式のレスポンス
 */
export const processLineEvents = async (
  body: LineRequestBody,
  db: D1Database
): Promise<LineResponseBody | Record<string, never>> => {
  if (body.events && Array.isArray(body.events) && body.events.length > 0) {
    // replyTokenを取得（存在する場合）
    const event = body.events[0];
    const replyToken = event.replyToken || LINE.DUMMY_TOKEN;

    // イベントがメッセージの場合
    if (event.type === "message" && event.message?.type === "text") {
      console.log(`[MESSAGE] Received: ${event.message.text}`);

      // デフォルトの応答メッセージ
      const defaultMessage = "何かお手伝いできることはありますか？";

      return createLineResponse(defaultMessage, replyToken);
    }

    // その他のイベントではデータベースからランダムメッセージを取得
    return await getRandomMessageFromDB(db, replyToken);
  }
  return {};
};

/**
 * POSTリクエストのデータを安全に処理する共通関数
 * @param body LINEリクエストボディまたは文字列
 * @param db D1データベース
 * @returns 処理結果のJSONオブジェクト
 */
export const safeProcessLineEvents = async (
  body: LineRequestBody | string,
  db: D1Database
): Promise<LineResponseBody | Record<string, never>> => {
  // bodyのログ出力
  console.log(
    `[LINE REQUEST] ${typeof body === "string" ? body : JSON.stringify(body)}`
  );

  return await safeOperation(
    async () => {
      const parsedBody =
        typeof body === "string" ? safeJsonParse<LineRequestBody>(body) : body;

      if (parsedBody) {
        return await processLineEvents(parsedBody, db);
      }
      return {};
    },
    {},
    ERROR.PROCESSING_LINE_EVENTS
  );
};

/**
 * POSTリクエストのハンドラー
 * @param req リクエストオブジェクト
 * @param res レスポンスオブジェクト
 * @param db D1データベース
 */
export const handlePostRequest = (
  req: IncomingMessage,
  res: ServerResponse,
  db: D1Database
): void => {
  let data = "";

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", async () => {
    // リクエストのログ出力
    console.log(`[POST REQUEST] ${req.url}`);
    console.log(`[POST HEADERS] ${JSON.stringify(req.headers)}`);
    console.log(`[POST BODY] ${data}`);

    const responseMessage = await safeOperation(
      async () => await safeProcessLineEvents(data, db),
      {},
      ERROR.POST_REQUEST
    );

    const hasContent = Object.keys(responseMessage).length > 0;
    sendResponse(
      res,
      200,
      hasContent ? responseMessage : "",
      hasContent ? CONTENT_TYPE.JSON : CONTENT_TYPE.TEXT
    );
  });
};

/**
 * Cloudflare Workersのリクエストハンドラー
 * @param request リクエストオブジェクト
 * @param env 環境変数
 * @returns レスポンスオブジェクト
 */
export const handleCloudflareRequest = async (
  request: Request,
  env: Env
): Promise<Response> => {
  // リクエストの詳細情報をログ出力
  logRequest(request.method, request.url, request.headers);

  if (request.method === "POST") {
    return await safeOperation(
      async () => {
        try {
          // リクエストボディをクローンして取得（JSONとしてパースする前にログ出力用）
          const clonedRequest = request.clone();
          const rawBody = await clonedRequest.text();
          console.log(`[RAW REQUEST BODY] ${rawBody}`);

          // 元のリクエストからJSONを取得
          const body = await request.json();

          // パース済みボディもログ出力
          console.log(`[PARSED REQUEST BODY] ${JSON.stringify(body)}`);

          // LINE.CHANNEL_ACCESS_TOKENに環境変数の値を設定
          LINE.CHANNEL_ACCESS_TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN;

          const responseData = await safeProcessLineEvents(body, env.DB);
          const hasContent = Object.keys(responseData).length > 0;

          // レスポンスのログ出力
          console.log(
            `[RESPONSE] ${
              hasContent ? JSON.stringify(responseData) : "Empty response"
            }`
          );

          // 実際にLINE APIに返信を送信
          if (
            hasContent &&
            "replyToken" in responseData &&
            responseData.replyToken !== LINE.DUMMY_TOKEN
          ) {
            const lineApiResponse = await sendLineReply(
              responseData as LineResponseBody
            );
            console.log(
              `[LINE API CALL] Complete with status: ${lineApiResponse.status}`
            );
          }

          // Webhookには常に200 OKを返す（LINE APIの仕様）
          return createCloudflareResponse(200, "");
        } catch (error) {
          console.error(`[ERROR] Failed to process request: ${error}`);
          return createCloudflareResponse(200, "");
        }
      },
      createCloudflareResponse(200, ""),
      ERROR.CLOUDFLARE_REQUEST
    );
  }

  // GETリクエストの応答
  console.log("[RESPONSE] Hello World!");
  return createCloudflareResponse(200, "Hello World!", CONTENT_TYPE.TEXT);
};
