import { D1Database } from "./types";
import { safeOperation } from "./utils";
import { DB } from "./constants";

// 環境チェック用の関数
const isCloudflareEnvironment = (): boolean => {
  return typeof process === "undefined";
};

/**
 * Cloudflare Workersの環境用のD1データベースを作成する関数
 * @param env Cloudflare環境のバインディング
 * @returns D1データベースインターフェースの実装オブジェクト
 */
export const createCloudflareD1Database = (env: any): D1Database => {
  return env.DB as D1Database;
};

// ローカル環境用のD1データベースインターフェース
export const createLocalD1Interface = (): D1Database => {
  return {
    prepare: (query: string) => {
      return {
        all: async () => {
          try {
            // ダイナミックインポートを使用してモジュールをロード
            const fs = await import("fs").then(
              (module) => module.default || module
            );
            const path = await import("path").then(
              (module) => module.default || module
            );
            const sqlite3 = await import("sqlite3").then(
              (module) => module.default || module
            );
            const sqliteModule = await import("sqlite").then(
              (module) => module.default || module
            );

            // データベースファイルのパスを取得
            const dbDir = path.join(process.cwd(), ".wrangler", "local");
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir, { recursive: true });
            }
            const dbPath = path.join(dbDir, "usako-messages.sqlite");

            // データベースを開く
            const db = await sqliteModule.open({
              filename: dbPath,
              driver: sqlite3.Database,
            });

            // テーブルの初期化
            await db.exec(`
              CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );
            `);

            // サンプルデータの挿入
            const count = await db.get(
              "SELECT COUNT(*) as count FROM messages"
            );
            if (count.count === 0) {
              const sampleMessages = [
                "こんにちは！",
                "元気ですか？",
                "何かお手伝いできることはありますか？",
                "素敵な一日をお過ごしください",
                "うさこだよ！",
              ];

              await db.run("BEGIN TRANSACTION");
              try {
                const stmt = await db.prepare(
                  "INSERT INTO messages (message) VALUES (?)"
                );
                for (const message of sampleMessages) {
                  await stmt.run(message);
                }
                await db.run("COMMIT");
              } catch (error) {
                await db.run("ROLLBACK");
                throw error;
              }
            }

            // クエリを実行
            const results = await db.all(query);
            return { results };
          } catch (error) {
            console.error("Error executing local database query:", error);
            return { results: [] };
          }
        },
      };
    },
  };
};

/**
 * 環境に応じた適切なD1データベースを作成する関数
 * @returns D1データベースインターフェースの実装オブジェクト
 */
export const createD1Database = async (): Promise<D1Database> => {
  // Cloudflare環境では何もしない
  // (実際のDB操作はCloudflare Workersの環境変数から取得したDBを使用する)
  if (isCloudflareEnvironment()) {
    console.log(
      "Running in Cloudflare environment. Real D1 will be used via env bindings."
    );
    return {
      prepare: (query: string) => {
        return {
          all: async () => {
            console.warn(
              "This is a placeholder. In Cloudflare environment, the actual DB should be passed via env variables."
            );
            return { results: [] };
          },
        };
      },
    };
  }

  // ローカル環境ではSQLiteを使用
  console.log("Running in local environment. SQLite will be used.");
  return createLocalD1Interface();
};
