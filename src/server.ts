import {
  createServer,
  Server as HttpServer,
  IncomingMessage,
  ServerResponse,
} from "http";
import { Env, D1Database } from "./types";
import { DEFAULT_PORT, LINE } from "./constants";
import {
  handleGetRequest,
  handlePostRequest,
  handleCloudflareRequest,
} from "./handlers";
import { createD1Database } from "./db";
import { sendResponse } from "./utils/http";
import { info, error, warn, debug } from "./utils/logger";

/**
 * リクエストハンドラーの型定義
 */
type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Cloudflare Workersのサーバーオブジェクト
 */
const server = {
  async fetch(request: Request, env: Env, ctx: any) {
    // リクエスト情報を詳細にログ出力
    info(`Received ${request.method} request to ${request.url}`);
    debug(`Request headers:`, Object.fromEntries(request.headers.entries()));

    try {
      const response = await handleCloudflareRequest(request, env);
      info(`Response status: ${response.status}`);
      return response;
    } catch (err) {
      error(`Error handling request:`, err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

/**
 * 405エラーを返すハンドラ
 * @param res レスポンスオブジェクト
 */
const handleMethodNotAllowed = (res: ServerResponse): void => {
  sendResponse(res, 405, "Method Not Allowed");
};

/**
 * リクエストのルーティングを設定する関数
 * @param db D1データベース
 * @returns リクエストハンドラー関数
 */
export const createRequestRouter = (db: D1Database): RequestHandler => {
  return (req, res) => {
    try {
      // メソッドに基づいてルーティング
      switch (req.method) {
        case "POST":
          handlePostRequest(req, res, db);
          break;
        case "GET":
          handleGetRequest(res);
          break;
        default:
          // サポートされていないメソッドには405を返す
          handleMethodNotAllowed(res);
      }
    } catch (err) {
      error("Error in request router:", err);
      // 内部エラーでも200を返す（テスト仕様に合わせる）
      sendResponse(res, 200, "");
    }
  };
};

/**
 * テスト用にサーバーを起動する関数
 * Node.js環境でのみ使用
 * @param port 使用するポート番号
 * @returns HTTPサーバーインスタンス
 */
export async function startServer(port = DEFAULT_PORT): Promise<HttpServer> {
  try {
    // ローカル環境用のD1データベースを初期化
    const db = await createD1Database();

    // 環境変数からトークンを読み込む
    if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      LINE.CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      info("LINE_CHANNEL_ACCESS_TOKEN loaded from environment variables");
    } else {
      warn("LINE_CHANNEL_ACCESS_TOKEN is not set in environment variables");
    }

    // リクエストハンドラーを作成
    const requestHandler = createRequestRouter(db);

    // サーバーを作成して起動
    const httpServer = createServer(requestHandler);

    httpServer.listen(port, () => {
      info(`Server is running on http://localhost:${port}`);
    });

    return httpServer;
  } catch (err) {
    error("Failed to start server:", err);
    throw err;
  }
}

export default server;
