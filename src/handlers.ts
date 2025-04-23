import { IncomingMessage, ServerResponse } from "http";
import { Env, D1Database, Message } from "./types";
import {
  getRandomMessageFromDB,
  safeJsonParse,
  formatErrorMessage,
} from "./utils";
import { CONTENT_TYPE_JSON, CONTENT_TYPE_TEXT } from "./constants";

/**
 * レスポンスを返す共通関数
 * @param res レスポンスオブジェクト
 * @param status ステータスコード
 * @param message メッセージ
 * @param headers ヘッダー
 */
export const sendResponse = (
  res: ServerResponse,
  status: number = 200,
  message: string = "",
  headers: Record<string, string> = CONTENT_TYPE_TEXT
): void => {
  res.writeHead(status, headers);
  res.end(message);
};

/**
 * GETリクエストのハンドラー
 * @param res レスポンスオブジェクト
 */
export const handleGetRequest = (res: ServerResponse): void => {
  sendResponse(res, 200, "Hello World!", CONTENT_TYPE_TEXT);
};

/**
 * POSTリクエストのデータを処理する関数
 * @param data リクエストボディ
 * @param db D1データベース
 * @returns 処理結果のメッセージ
 */
export const processPostRequestData = async (
  data: string,
  db: D1Database
): Promise<string> => {
  const body = safeJsonParse<{ events?: unknown[] }>(data);

  if (body && body.events && Array.isArray(body.events)) {
    return await getRandomMessageFromDB(db);
  }

  return "";
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
    try {
      const responseMessage = await processPostRequestData(data, db);

      if (responseMessage) {
        sendResponse(res, 200, responseMessage, CONTENT_TYPE_JSON);
        return;
      }

      // JSON解析エラーを含め、常に200を返す
      sendResponse(res, 200);
    } catch (error) {
      console.error("Error in POST request handler:", error);
      // エラーが発生しても200で返す（テスト仕様に合わせる）
      sendResponse(res, 200, "");
    }
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
    try {
      const body = await request.json();

      if (body.events && Array.isArray(body.events)) {
        const randomMessage = await getRandomMessageFromDB(env.DB);
        return new Response(randomMessage, { status: 200 });
      }
    } catch (error) {
      console.error("Error handling POST request:", error);
      // エラーが発生しても200で返す（テスト仕様に合わせる）
      return new Response("", { status: 200 });
    }
  }

  return new Response("Hello World!", {
    status: 200,
    headers: CONTENT_TYPE_TEXT,
  });
};
