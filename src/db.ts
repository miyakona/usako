import { D1Database } from "./types";
import { RANDOM_MESSAGES } from "./constants";

/**
 * ローカル環境用のD1データベースを作成する関数
 * @returns D1データベースインターフェースの実装オブジェクト
 */
export const createD1Database = (): D1Database => {
  // モックデータとしてメモリ内のメッセージ配列を使用
  const messages = [...RANDOM_MESSAGES];

  /**
   * ランダムメッセージクエリを処理する関数
   * @returns ランダムに選ばれたメッセージ
   */
  const handleRandomMessageQuery = () => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return { results: [{ message: messages[randomIndex] }] };
  };

  /**
   * 全メッセージクエリを処理する関数
   * @returns すべてのメッセージ
   */
  const handleAllMessagesQuery = () => {
    return { results: messages.map((message) => ({ message })) };
  };

  return {
    prepare: (query: string) => {
      return {
        all: async () => {
          // クエリパターンに基づいて処理を分岐
          if (query.includes("ORDER BY RANDOM() LIMIT 1")) {
            return handleRandomMessageQuery();
          }

          // デフォルトでは全てのメッセージを返す
          return handleAllMessagesQuery();
        },
      };
    },
  };
};
