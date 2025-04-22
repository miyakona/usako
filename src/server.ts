import { createServer } from "http";

const server = {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);

    // ルートエンドポイントの処理
    if (url.pathname === "/") {
      return new Response("Hello World!", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 404 Not Found
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  },
};

// テスト用にサーバーを起動する関数
export function startServer(port = 8787) {
  const httpServer = createServer((req, res) => {
    // リクエストパスを確認
    if (req.url === "/" || req.url === undefined) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hello World!");
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  return httpServer;
}

export default server;
