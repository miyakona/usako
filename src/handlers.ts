import { IncomingMessage, ServerResponse } from "http";
import { Env, D1Database, LineRequestBody, LineResponseBody } from "./types";
import {
  getRandomMessageFromDB,
  formatErrorMessage,
  createLineResponse,
} from "./utils";
import { CONTENT_TYPE_JSON, CONTENT_TYPE_TEXT } from "./constants";

/**
 * JSONを安全にパースする関数
 * @param data パースする文字列
 * @returns パース結果またはnull
 */
const safeJsonParse = <T>(data: string): T | null => {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
};

/**
 * レスポンスを返す共通関数
 * @param res レスポンスオブジェクト
 * @param status ステータスコード
 * @param message メッセージまたはJSONオブジェクト
 * @param headers ヘッダー
 */
export const sendResponse = (
  res: ServerResponse,
  status: number = 200,
  message: string | object = "",
  headers: Record<string, string> = CONTENT_TYPE_TEXT
): void => {
  res.writeHead(status, headers);
  res.end(typeof message === "string" ? message : JSON.stringify(message));
};

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
    const replyToken = body.events[0]?.replyToken || "dummy-token";
    return await getRandomMessageFromDB(db, replyToken);
  }
  return {};
};

/**
 * POSTリクエストのデータを処理する関数
 * @param data リクエストボディ
 * @param db D1データベース
 * @returns 処理結果のJSONオブジェクト
 */
export const processPostRequestData = async (
  data: string,
  db: D1Database
): Promise<LineResponseBody | Record<string, never>> => {
  const body = safeJsonParse<LineRequestBody>(data);
  if (body) {
    return await processLineEvents(body, db);
  }
  return {};
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

      if (Object.keys(responseMessage).length > 0) {
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
      const body = (await request.json()) as LineRequestBody;
      const responseData = await processLineEvents(body, env.DB);

      if (Object.keys(responseData).length > 0) {
        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      // 処理結果がない場合は空レスポンス
      return new Response("", { status: 200 });
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
