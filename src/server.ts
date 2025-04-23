import { createServer } from "http";
import { Env } from "./types";
import { DEFAULT_PORT } from "./constants";
import {
  handleGetRequest,
  handlePostRequest,
  handleCloudflareRequest,
} from "./handlers";
import { getRandomMessage, getRandomMessageFromDB } from "./utils";

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
  const httpServer = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/") {
      handlePostRequest(req, res);
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
export { getRandomMessage, getRandomMessageFromDB };

export default server;
