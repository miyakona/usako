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
} from "./utils";
import {
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_TEXT,
  ERROR_PROCESSING_LINE_EVENTS,
  ERROR_POST_REQUEST,
  ERROR_CLOUDFLARE_REQUEST,
  LINE_DUMMY_TOKEN,
} from "./constants";

/**
 * GETリクエストのハンドラー
 * @param res レスポンスオブジェクト
 */
export const handleGetRequest = (res: ServerResponse): void => {
  sendResponse(res, 200, "Hello World!", CONTENT_TYPE_TEXT);
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
  if (body.events && Array.isArray(body.events)) {
    // replyTokenを取得（存在する場合）
    const replyToken = body.events[0]?.replyToken || LINE_DUMMY_TOKEN;
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
    ERROR_PROCESSING_LINE_EVENTS
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
    const responseMessage = await safeOperation(
      async () => await safeProcessLineEvents(data, db),
      {},
      ERROR_POST_REQUEST
    );

    const hasContent = Object.keys(responseMessage).length > 0;
    sendResponse(
      res,
      200,
      hasContent ? responseMessage : "",
      hasContent ? CONTENT_TYPE_JSON : CONTENT_TYPE_TEXT
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
  if (request.method === "POST") {
    return await safeOperation(
      async () => {
        const body = await request.json();
        const responseData = await safeProcessLineEvents(body, env.DB);
        const hasContent = Object.keys(responseData).length > 0;

        return createCloudflareResponse(
          200,
          hasContent ? responseData : "",
          hasContent ? CONTENT_TYPE_JSON : CONTENT_TYPE_TEXT
        );
      },
      createCloudflareResponse(200, ""),
      ERROR_CLOUDFLARE_REQUEST
    );
  }

  return createCloudflareResponse(200, "Hello World!", CONTENT_TYPE_TEXT);
};
