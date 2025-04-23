import { createServer } from "http";
import { startServer, getRandomMessageFromDB } from "../../src/server";
import * as http from "http";

// getRandomMessageFromDB関数と環境変数用のモック
const mockD1Database = {
  prepare: jest.fn().mockReturnThis(),
  all: jest
    .fn()
    .mockResolvedValue({ results: [{ message: "テストメッセージ" }] }),
};

// httpサーバーのモック
jest.mock("http", () => ({
  createServer: jest.fn().mockImplementation((callback: any) => ({
    listen: jest.fn().mockImplementation((port: number, cb: () => void) => {
      cb && cb();
      return {
        close: jest.fn(),
      };
    }),
  })),
}));

describe("server.ts の単体テスト", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("startServer", () => {
    test("HTTPサーバーを起動すること", () => {
      const server = startServer(8789);

      // createServerが呼ばれたことを確認
      expect(createServer).toHaveBeenCalled();

      // listenが正しいポートで呼ばれたことを確認
      const mockServer = (createServer as jest.Mock).mock.results[0].value;
      expect(mockServer.listen).toHaveBeenCalledWith(
        8789,
        expect.any(Function)
      );
    });

    test("GETリクエストに対して「Hello World!」を返すこと", () => {
      const server = startServer(8790);

      // リクエストハンドラーを取得
      const requestHandler = (createServer as jest.Mock).mock.calls[0][0];

      // モックリクエストとレスポンス
      const mockReq = {
        method: "GET",
        url: "/",
      };

      const mockRes = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      // リクエストハンドラーを呼び出す
      requestHandler(mockReq, mockRes);

      // レスポンスが正しく設定されたことを確認
      expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "text/plain",
      });
      expect(mockRes.end).toHaveBeenCalledWith("Hello World!");
    });

    test("POSTリクエストに対してD1からのメッセージを返すこと", async () => {
      // startServerをテスト
      const server = startServer(8788);

      // createServerが呼ばれたことを確認
      expect(createServer).toHaveBeenCalled();

      // リクエストハンドラーを取得
      const requestHandler = (createServer as jest.Mock).mock.calls[0][0];

      // モックリクエストとレスポンス
      type MockReq = {
        method: string;
        url: string;
        on: jest.Mock;
      };

      const mockReq: MockReq = {
        method: "POST",
        url: "/",
        on: jest
          .fn()
          .mockImplementation((event: string, callback: Function): MockReq => {
            if (event === "data") {
              callback(JSON.stringify({ events: [{}] }));
            }
            if (event === "end") {
              // 非同期コールバックをシミュレート
              setTimeout(() => callback(), 0);
            }
            return mockReq;
          }),
      };

      const mockRes = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      // リクエストハンドラーを呼び出す
      requestHandler(mockReq, mockRes);

      // 非同期処理を待つ
      await new Promise((resolve) => setTimeout(resolve, 10));

      // レスポンスが呼び出されたことを確認
      expect(mockRes.end).toHaveBeenCalled();
    });

    test("不正なPOSTリクエストに対して200を返すこと", () => {
      const server = startServer(8791);

      // リクエストハンドラーを取得
      const requestHandler = (createServer as jest.Mock).mock.calls[0][0];

      // モックリクエストとレスポンス（不正なJSONを送信）
      const mockReq = {
        method: "POST",
        url: "/",
        on: jest.fn((event: string, callback: Function) => {
          if (event === "data") {
            callback("不正なJSON");
          }
          if (event === "end") {
            callback();
          }
        }),
      };

      const mockRes = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      // リクエストハンドラーを呼び出す
      requestHandler(mockReq, mockRes);

      // エラーが発生しても200が返されることを確認
      expect(mockRes.writeHead).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  // Cloudflare Workersのserverオブジェクト用のテスト
  describe("server.fetch", () => {
    // このテストではCloudflare Workers環境を模倣

    test("GETリクエストに対して「Hello World!」を返すこと", async () => {
      // テスト対象のモジュールを動的にインポート
      const serverModule = await import("../../src/server");
      const server = serverModule.default;

      // モックリクエストとenv
      const mockRequest = new Request("https://example.com", {
        method: "GET",
      });

      const mockEnv = {
        DB: mockD1Database,
      };

      // fetchを呼び出す
      const response = await server.fetch(mockRequest, mockEnv, {});

      // レスポンスをテスト
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hello World!");
    });

    test("POSTリクエストに対してD1からのメッセージを返すこと", async () => {
      // テスト対象のモジュールを動的にインポート
      const serverModule = await import("../../src/server");
      const server = serverModule.default;

      // モックリクエストとenv
      const mockRequest = new Request("https://example.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: [{}] }),
      });

      const mockEnv = {
        DB: mockD1Database,
      };

      // fetchを呼び出す
      const response = await server.fetch(mockRequest, mockEnv, {});

      // レスポンスをテスト
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("テストメッセージ");

      // D1が正しく呼び出されたことを確認
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        "SELECT message FROM messages ORDER BY RANDOM() LIMIT 1"
      );
      expect(mockD1Database.all).toHaveBeenCalled();
    });
  });

  // getRandomMessageFromDBのテスト
  describe("getRandomMessageFromDB", () => {
    test("D1から正常にメッセージを取得できること", async () => {
      // D1からメッセージを正常に取得できる場合のテスト
      mockD1Database.all.mockResolvedValueOnce({
        results: [{ message: "D1からのテストメッセージ" }],
      });

      // 関数を呼び出す（エクスポートされている関数を直接テスト）
      const message = await getRandomMessageFromDB(mockD1Database);

      // 期待される結果
      expect(message).toBe("D1からのテストメッセージ");
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        "SELECT message FROM messages ORDER BY RANDOM() LIMIT 1"
      );
    });

    test("D1からメッセージ取得に失敗した場合はエラーメッセージを返すこと", async () => {
      // D1からメッセージ取得に失敗する場合のテスト
      const testError = new Error("DB error");
      mockD1Database.all.mockRejectedValueOnce(testError);

      // 関数を呼び出す
      const message = await getRandomMessageFromDB(mockD1Database);

      // 期待される結果
      expect(message).toBe(`エラーが発生しました: ${testError.message}`);
    });

    test("D1から空の結果が返された場合はデフォルトメッセージを返すこと", async () => {
      // D1から空の結果が返される場合のテスト
      mockD1Database.all.mockResolvedValueOnce({ results: [] });

      // 関数を呼び出す
      const message = await getRandomMessageFromDB(mockD1Database);

      // 期待される結果
      expect(message).toBe("こんにちは！");
    });
  });
});
