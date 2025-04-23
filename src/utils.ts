import { D1Database } from "./types";
import { DEFAULT_MESSAGE, RANDOM_MESSAGES } from "./constants";

/**
 * D1からランダムなメッセージを取得する関数
 * @param db D1データベース
 * @returns ランダムなメッセージ
 */
export const getRandomMessageFromDB = async (
  db: D1Database
): Promise<string> => {
  try {
    // ランダムな1つのメッセージを取得
    const { results } = await db
      .prepare("SELECT message FROM messages ORDER BY RANDOM() LIMIT 1")
      .all();

    if (results && results.length > 0) {
      return results[0].message;
    }
    return DEFAULT_MESSAGE;
  } catch (error) {
    console.error("Error fetching message from DB:", error);
    return DEFAULT_MESSAGE;
  }
};

/**
 * フォールバック用のランダムメッセージを返す関数
 * @returns ランダムなメッセージ
 */
export const getRandomMessage = (): string => {
  return RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
};

/**
 * JSONを安全にパースする関数
 * @param data パースする文字列
 * @returns パース結果またはnull
 */
export const safeJsonParse = (data: string): any | null => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
};
