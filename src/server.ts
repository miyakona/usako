import { createServer } from "http";

// ランダムメッセージを返す関数
const getRandomMessage = () => {
  const messages = [
    "こんにちは！",
    "元気ですか？",
    "何かお手伝いできることはありますか？",
    "素敵な一日をお過ごしください",
    "うさこだよ！",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

const server = {
  async fetch(request: Request, env: any, ctx: any) {
    // POSTリクエストを処理
    if (request.method === "POST") {
      const body = await request.json();

      // LINE Messaging API形式のレスポンス
      if (body.events && Array.isArray(body.events)) {
        return new Response("", { status: 200 });
      }
    }

    // GETリクエストの場合はHello Worldを返す
    return new Response("Hello World!", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
};

// テスト用にサーバーを起動する関数
export function startServer(port = 8787) {
  const httpServer = createServer((req, res) => {
    // POSTリクエストを処理
    if (req.method === "POST" && req.url === "/") {
      let data = "";

      req.on("data", (chunk) => {
        data += chunk;
      });

      req.on("end", () => {
        try {
          // リクエストボディをパース
          const body = JSON.parse(data);

          // LINE Messaging API形式のリクエストを処理
          if (body.events && Array.isArray(body.events)) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(getRandomMessage());
            return;
          }
        } catch (e) {
          console.error("Error parsing request body:", e);
        }

        res.writeHead(200);
        res.end();
      });

      return;
    }

    // GETリクエストの場合はHello Worldを返す
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello World!");
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  return httpServer;
}

export default server;
