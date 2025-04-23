import { D1Database } from "./types";
import { RANDOM_MESSAGES } from "./constants";

/**
 * ローカル環境用のD1データベースを作成する関数
 * @returns D1データベースインターフェースの実装オブジェクト
 */
export const createD1Database = (): D1Database => {
  // メモリ内のメッセージ配列を使用してD1インターフェースをシミュレート
  const messages = [...RANDOM_MESSAGES];

  return {
    prepare: (query: string) => {
      return {
        all: async () => {
          if (query.includes("ORDER BY RANDOM() LIMIT 1")) {
            // ランダムなメッセージを1つ返す
            const randomIndex = Math.floor(Math.random() * messages.length);
            return {
              results: [{ message: messages[randomIndex] }],
            };
          }

          // その他のクエリの場合は全てのメッセージを返す
          return {
            results: messages.map((message) => ({ message })),
          };
        },
      };
    },
  };
};
