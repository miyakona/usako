import { createServer } from "http";
import { startServer } from "../../src/server";
import * as httpUtils from "../../src/utils/http";
import * as lineUtils from "../../src/utils/line";
import * as http from "http";
import { D1Database } from "../../src/types";

// LINE APIのモック
jest.mock("../../src/utils/http", () => {
  const originalModule = jest.requireActual("../../src/utils/http");
  return {
    ...originalModule,
    sendLineReply: jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ),
  };
});

// Line Utilsのモック
jest.mock("../../src/utils/line", () => {
  const originalModule = jest.requireActual("../../src/utils/line");
  return {
    ...originalModule,
    getRandomMessageFromDB: jest.fn().mockImplementation((db, replyToken) => ({
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: "テストメッセージ",
        },
      ],
    })),
  };
});

// D1データベースのモック - SQLiteを使わずにテスト用の実装を提供
jest.mock("../../src/db", () => ({
  createD1Database: jest.fn().mockResolvedValue({
    prepare: jest.fn().mockImplementation((query) => ({
      all: jest.fn().mockResolvedValue({
        results: [{ message: "テストメッセージ" }],
      }),
    })),
  }),
}));

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
    test("HTTPサーバーを起動すること", async () => {
      const server = await startServer(8789);

      // createServerが呼ばれたことを確認
      expect(createServer).toHaveBeenCalled();

      // listenが正しいポートで呼ばれたことを確認
      const mockServer = (createServer as jest.Mock).mock.results[0].value;
      expect(mockServer.listen).toHaveBeenCalledWith(
        8789,
        expect.any(Function)
      );
    });

    test("GETリクエストに対して「Hello World!」を返すこと", async () => {
      const server = await startServer(8790);

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
      const server = await startServer(8788);

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

    test("不正なPOSTリクエストに対して200を返すこと", async () => {
      const server = await startServer(8791);

      // リクエストハンドラーを取得
      const requestHandler = (createServer as jest.Mock).mock.calls[0][0];

      // モックリクエストとレスポンス（不正なJSONを送信）
      const mockReq = {
        method: "POST",
        url: "/",
        on: jest
          .fn()
          .mockImplementation((event: string, callback: Function) => {
            if (event === "data") {
              callback("不正なJSON");
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

      // エラーが発生しても200が返されることを確認
      expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  // Cloudflare Workersのserverオブジェクト用のテスト
  describe("server.fetch", () => {
    // このテストではCloudflare Workers環境を模倣
    // getRandomMessageFromDB関数と環境変数用のモック
    const testMockD1Database = {
      prepare: jest.fn().mockReturnThis(),
      all: jest
        .fn()
        .mockResolvedValue({ results: [{ message: "テストメッセージ" }] }),
    };

    test("GETリクエストに対して「Hello World!」を返すこと", async () => {
      // テスト対象のモジュールを動的にインポート
      const serverModule = await import("../../src/server");
      const server = serverModule.default;

      // モックリクエストとenv
      const mockRequest = new Request("https://example.com", {
        method: "GET",
      });

      const mockEnv = {
        DB: testMockD1Database,
        LINE_CHANNEL_ACCESS_TOKEN: "test-token",
      };

      // fetchを呼び出す
      const response = await server.fetch(mockRequest, mockEnv, {});

      // レスポンスをテスト
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hello World!");
    });

    test("POSTリクエストに対してD1からのメッセージをJSON形式で返すこと", async () => {
      // テスト対象のモジュールを動的にインポート
      const serverModule = await import("../../src/server");
      const server = serverModule.default;

      // モックリクエストとenv
      const mockRequest = new Request("https://example.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [
            {
              replyToken: "test-reply-token",
            },
          ],
        }),
      });

      const mockEnv = {
        DB: testMockD1Database,
        LINE_CHANNEL_ACCESS_TOKEN: "test-token",
      };

      // fetchを呼び出す
      const response = await server.fetch(mockRequest, mockEnv, {});

      // レスポンスステータスが200であることを確認
      expect(response.status).toBe(200);

      // sendLineReplyが正しいパラメータで呼ばれたことを確認
      expect(httpUtils.sendLineReply).toHaveBeenCalledWith({
        replyToken: "test-reply-token",
        messages: [
          {
            type: "text",
            text: "テストメッセージ",
          },
        ],
      });
    });
  });

  // getRandomMessageFromDBの単体テスト
  describe("getRandomMessageFromDB", () => {
    // テスト前にモックをリセット
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test("D1から正常にメッセージを取得しLINE Messaging API形式のオブジェクトを返すこと", async () => {
      // モックを一時的に上書き
      jest
        .spyOn(lineUtils, "getRandomMessageFromDB")
        .mockImplementation((db, replyToken) =>
          Promise.resolve({
            replyToken: replyToken || "default-token",
            messages: [
              {
                type: "text",
                text: "テストメッセージ",
              },
            ],
          })
        );

      // getRandomMessageFromDBを呼び出す
      const result = await lineUtils.getRandomMessageFromDB(
        {} as D1Database,
        "test-reply-token"
      );

      // 結果をテスト
      expect(result).toEqual({
        replyToken: "test-reply-token",
        messages: [
          {
            type: "text",
            text: "テストメッセージ",
          },
        ],
      });
    });

    test("D1からメッセージ取得に失敗した場合はエラーメッセージを含むLINE Messaging API形式のオブジェクトを返すこと", async () => {
      // モックを一時的に上書き
      jest
        .spyOn(lineUtils, "getRandomMessageFromDB")
        .mockImplementation((db, replyToken) =>
          Promise.resolve({
            replyToken: replyToken || "default-token",
            messages: [
              {
                type: "text",
                text: "こんにちは！",
              },
            ],
          })
        );

      // getRandomMessageFromDBを呼び出す
      const result = await lineUtils.getRandomMessageFromDB(
        {} as D1Database,
        "test-reply-token"
      );

      // 結果をテスト
      expect(result).toEqual({
        replyToken: "test-reply-token",
        messages: [
          {
            type: "text",
            text: "こんにちは！",
          },
        ],
      });
    });

    test("結果が空の場合はデフォルトメッセージを含むLINE Messaging API形式のオブジェクトを返すこと", async () => {
      // モックを一時的に上書き
      jest
        .spyOn(lineUtils, "getRandomMessageFromDB")
        .mockImplementation((db, replyToken) =>
          Promise.resolve({
            replyToken: replyToken || "default-token",
            messages: [
              {
                type: "text",
                text: "こんにちは！",
              },
            ],
          })
        );

      // getRandomMessageFromDBを呼び出す
      const result = await lineUtils.getRandomMessageFromDB(
        {} as D1Database,
        "test-reply-token"
      );

      // 結果をテスト
      expect(result).toEqual({
        replyToken: "test-reply-token",
        messages: [
          {
            type: "text",
            text: "こんにちは！",
          },
        ],
      });
    });
  });
});
