import { IncomingMessage, ServerResponse } from "http";
import { Env, D1Database } from "./types";
import { getRandomMessageFromDB, safeJsonParse } from "./utils";
import { CONTENT_TYPE_JSON, CONTENT_TYPE_TEXT } from "./constants";

/**
 * GETリクエストのハンドラー
 * @param res レスポンスオブジェクト
 */
export const handleGetRequest = (res: ServerResponse): void => {
  res.writeHead(200, CONTENT_TYPE_TEXT);
  res.end("Hello World!");
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
    const body = safeJsonParse(data);

    if (body && body.events && Array.isArray(body.events)) {
      const randomMessage = await getRandomMessageFromDB(db);
      res.writeHead(200, CONTENT_TYPE_JSON);
      res.end(randomMessage);
      return;
    }

    res.writeHead(200);
    res.end();
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
    }
  }

  return new Response("Hello World!", {
    status: 200,
    headers: CONTENT_TYPE_TEXT,
  });
};
