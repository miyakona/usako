import { D1Database } from "./types";
import * as fs from "fs";
import * as path from "path";
import * as sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

/**
 * SQLiteデータベースを使用してクエリを実行する関数
 * @param db SQLiteデータベース
 * @param query SQLクエリ
 * @param params クエリパラメータ
 * @returns クエリ結果
 */
const executeQuery = async (
  db: Database<sqlite3.Database>,
  query: string,
  params: any[] = []
): Promise<any[]> => {
  try {
    return await db.all(query, params);
  } catch (error) {
    console.error("データベースクエリ実行エラー:", error);
    return [];
  }
};

/**
 * データベースファイルのパスを取得する関数
 * @returns データベースファイルのパス
 */
const getDatabasePath = (): string => {
  const dbDir = path.join(process.cwd(), ".wrangler", "local");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, "usako-messages.sqlite");
};

/**
 * データベーステーブルを初期化する関数
 * @param db SQLiteデータベース
 */
const initializeDatabaseTables = async (
  db: Database<sqlite3.Database>
): Promise<void> => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

/**
 * データベースにサンプルデータを挿入する関数
 * @param db SQLiteデータベース
 */
const insertSampleData = async (
  db: Database<sqlite3.Database>
): Promise<void> => {
  const count = await db.get("SELECT COUNT(*) as count FROM messages");
  if (count.count === 0) {
    await db.exec(`
      INSERT INTO messages (message) VALUES ('こんにちは！');
      INSERT INTO messages (message) VALUES ('元気ですか？');
      INSERT INTO messages (message) VALUES ('何かお手伝いできることはありますか？');
      INSERT INTO messages (message) VALUES ('素敵な一日をお過ごしください');
      INSERT INTO messages (message) VALUES ('うさこだよ！');
    `);
  }
};

/**
 * D1データベースインターフェースの実装を作成する関数
 * @param db SQLiteデータベース
 * @returns D1データベースインターフェースの実装オブジェクト
 */
const createD1Interface = (db: Database<sqlite3.Database>): D1Database => {
  return {
    prepare: (query: string) => {
      return {
        all: async () => {
          let results: any[] = [];

          if (query.includes("ORDER BY RANDOM() LIMIT 1")) {
            results = await executeQuery(
              db,
              "SELECT message FROM messages ORDER BY RANDOM() LIMIT 1"
            );
          } else {
            results = await executeQuery(db, "SELECT message FROM messages");
          }

          return { results };
        },
      };
    },
  };
};

/**
 * ローカル環境用のD1データベースを作成する関数
 * @returns D1データベースインターフェースの実装オブジェクト
 */
export const createD1Database = async (): Promise<D1Database> => {
  // データベースファイルのパスを取得
  const dbPath = getDatabasePath();

  // SQLiteデータベースを開く（なければ作成）
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // テーブルの初期化
  await initializeDatabaseTables(db);

  // サンプルデータの挿入
  await insertSampleData(db);

  // D1インターフェースを返す
  return createD1Interface(db);
};
