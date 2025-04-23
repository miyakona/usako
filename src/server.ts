import { createServer } from "http";

// Cloudflare D1の型定義
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  all(): Promise<{ results: any[] }>;
}

// D1からランダムなメッセージを取得する関数
const getRandomMessageFromDB = async (db: D1Database): Promise<string> => {
  try {
    // ランダムな1つのメッセージを取得
    const { results } = await db
      .prepare("SELECT message FROM messages ORDER BY RANDOM() LIMIT 1")
      .all();

    if (results && results.length > 0) {
      return results[0].message;
    }
    return "こんにちは！"; // デフォルトメッセージ
  } catch (error) {
    console.error("Error fetching message from DB:", error);
    return "こんにちは！"; // エラー時はデフォルトメッセージ
  }
};

// フォールバック用のランダムメッセージを返す関数
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

// 環境変数の型定義
interface Env {
  DB: D1Database;
}

const server = {
  async fetch(request: Request, env: Env, ctx: any) {
    // D1データベースの取得
    const db = env.DB;

    // POSTリクエストを処理
    if (request.method === "POST") {
      const body = await request.json();

      // LINE Messaging API形式のレスポンス
      if (body.events && Array.isArray(body.events)) {
        // D1からランダムメッセージを取得
        const randomMessage = await getRandomMessageFromDB(db);
        return new Response(randomMessage, { status: 200 });
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
            // ローカル環境ではD1が使えないためgetRandomMessage()を使用
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
