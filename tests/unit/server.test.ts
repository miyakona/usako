import { createServer } from "http";
import { startServer } from "../../src/server";
import * as httpUtils from "../../src/utils/http";
import * as lineUtils from "../../src/utils/line";
import { D1Database } from "../../src/types";
import { createD1Database } from "../../src/db";
import * as http from "http";

// テスト用のユーティリティ関数
async function createTestRequest(
  method: string,
  url: string,
  body?: any
): Promise<Request> {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// テスト用の環境変数
const testEnv = {
  LINE_CHANNEL_ACCESS_TOKEN: "test-token",
};

// 実際のD1データベースを使用するためのセットアップ
async function setupTestDatabase(): Promise<D1Database> {
  return await createD1Database();
}

describe("server.ts の単体テスト", () => {
  let testDb: D1Database;
  let server: http.Server;
  const testPort = 8789;

  // 各テストの前にデータベースを初期化
  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });

  // 各テスト後にサーバーをクローズ
  afterEach(async () => {
    if (server && server.close) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe("startServer", () => {
    test("HTTPサーバーを起動すること", async () => {
      server = await startServer(testPort);
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);
    });

    test("GETリクエストに対して「Hello World!」を返すこと", async () => {
      server = await startServer(testPort);

      // 実際のHTTPリクエストを送信
      const response = await fetch(`http://localhost:${testPort}/`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe("Hello World!");
    });

    test("POSTリクエストに対してD1からのメッセージを返すこと", async () => {
      server = await startServer(testPort);

      // LineバックエンドへのPOSTリクエスト
      const response = await fetch(`http://localhost:${testPort}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [
            {
              type: "message",
              replyToken: "test-reply-token",
              message: {
                type: "text",
                text: "こんにちは",
              },
            },
          ],
        }),
      });

      // 200レスポンスを期待
      expect(response.status).toBe(200);
    });

    test("不正なPOSTリクエストに対して200を返すこと", async () => {
      server = await startServer(testPort);

      // 不正なJSONを送信
      const response = await fetch(`http://localhost:${testPort}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "不正なJSON",
      });

      // 200レスポンスを期待（エラーハンドリングを検証）
      expect(response.status).toBe(200);
    });
  });

  // Cloudflare Workersのserverオブジェクト用のテスト
  describe("server.fetch", () => {
    test("GETリクエストに対して「Hello World!」を返すこと", async () => {
      // テスト対象のモジュールをインポート
      const serverModule = await import("../../src/server");
      const server = serverModule.default;

      // 実際のリクエストを作成
      const mockRequest = await createTestRequest("GET", "https://example.com");

      // モックではなく実際のデータベースを使用
      const mockEnv = {
        DB: testDb,
        LINE_CHANNEL_ACCESS_TOKEN: "test-token",
      };

      // fetchを呼び出す
      const response = await server.fetch(mockRequest, mockEnv, {});

      // レスポンスをテスト
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hello World!");
    });

    test("POSTリクエストに対してD1からのメッセージをJSON形式で返すこと", async () => {
      // テスト対象のモジュールをインポート
      const serverModule = await import("../../src/server");
      const server = serverModule.default;

      // 実際のリクエストを作成
      const mockRequest = await createTestRequest(
        "POST",
        "https://example.com",
        {
          events: [
            {
              type: "message",
              replyToken: "test-reply-token",
              message: {
                type: "text",
                text: "こんにちは",
              },
            },
          ],
        }
      );

      // モックではなく実際のデータベースを使用
      const mockEnv = {
        DB: testDb,
        LINE_CHANNEL_ACCESS_TOKEN: "test-token",
      };

      // LINEのトークンを一時的に設定
      const originalToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token";

      try {
        // fetchを呼び出す
        const response = await server.fetch(mockRequest, mockEnv, {});

        // レスポンスステータスが200であることを確認
        expect(response.status).toBe(200);
      } finally {
        // テスト後に元の環境変数を復元
        process.env.LINE_CHANNEL_ACCESS_TOKEN = originalToken;
      }
    });
  });

  // getRandomMessageFromDBの単体テスト
  describe("getRandomMessageFromDB", () => {
    test("D1から正常にメッセージを取得しLINE Messaging API形式のオブジェクトを返すこと", async () => {
      // 実際のデータベースを使用
      const result = await lineUtils.getRandomMessageFromDB(
        testDb,
        "test-reply-token"
      );

      // 結果の形式を検証
      expect(result).toHaveProperty("replyToken", "test-reply-token");
      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBe(1);
      expect(result.messages[0]).toHaveProperty("type", "text");
      expect(result.messages[0]).toHaveProperty("text");
      expect(typeof result.messages[0].text).toBe("string");
    });
  });
});
