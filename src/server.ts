import {
  createServer,
  Server as HttpServer,
  IncomingMessage,
  ServerResponse,
} from "http";
import { Env, D1Database } from "./types";
import { DEFAULT_PORT } from "./constants";
import {
  handleGetRequest,
  handlePostRequest,
  handleCloudflareRequest,
} from "./handlers";
import { getRandomMessageFromDB } from "./utils";
import { createD1Database } from "./db";

/**
 * リクエストハンドラーの型定義
 */
type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Cloudflare Workersのサーバーオブジェクト
 */
const server = {
  async fetch(request: Request, env: Env, ctx: any) {
    return handleCloudflareRequest(request, env);
  },
};

/**
 * リクエストのルーティングを設定する関数
 * @param db D1データベース
 * @returns リクエストハンドラー関数
 */
export const createRequestRouter = (db: D1Database): RequestHandler => {
  return (req, res) => {
    if (req.method === "POST" && req.url === "/") {
      handlePostRequest(req, res, db);
      return;
    }

    handleGetRequest(res);
  };
};

/**
 * テスト用にサーバーを起動する関数
 * @param port 使用するポート番号
 * @returns HTTPサーバーインスタンス
 */
export function startServer(port = DEFAULT_PORT): HttpServer {
  // ローカル環境用のD1データベースを初期化
  const db = createD1Database();

  // リクエストハンドラーを作成
  const requestHandler = createRequestRouter(db);

  // サーバーを作成して起動
  const httpServer = createServer(requestHandler);

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  return httpServer;
}

// 以前のバージョンとの互換性のためにエクスポート
export { getRandomMessageFromDB };

export default server;
