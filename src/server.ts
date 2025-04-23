import { createServer } from "http";
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
 * Cloudflare Workersのサーバーオブジェクト
 */
const server = {
  async fetch(request: Request, env: Env, ctx: any) {
    return handleCloudflareRequest(request, env);
  },
};

/**
 * テスト用にサーバーを起動する関数
 * @param port 使用するポート番号
 * @returns HTTPサーバーインスタンス
 */
export function startServer(port = DEFAULT_PORT) {
  // ローカル環境用のD1データベースを初期化
  const db = createD1Database();

  const httpServer = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/") {
      handlePostRequest(req, res, db);
      return;
    }

    handleGetRequest(res);
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  return httpServer;
}

// 以前のバージョンとの互換性のためにエクスポート
export { getRandomMessageFromDB };

export default server;
