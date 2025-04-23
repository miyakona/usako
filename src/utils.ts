import { D1Database, Message } from "./types";
import { DEFAULT_MESSAGE } from "./constants";

/**
 * D1からランダムなメッセージを取得する関数
 * @param db D1データベース
 * @returns ランダムなメッセージまたはエラーメッセージ
 */
export const getRandomMessageFromDB = async (
  db: D1Database
): Promise<string> => {
  try {
    // ランダムな1つのメッセージを取得
    const { results } = await db
      .prepare("SELECT message FROM messages ORDER BY RANDOM() LIMIT 1")
      .all();

    // 結果の検証と処理
    return results && results.length > 0 ? results[0].message : DEFAULT_MESSAGE;
  } catch (error) {
    console.error("Error fetching message from DB:", error);
    // エラーメッセージをそのまま返す
    return formatErrorMessage(error);
  }
};

/**
 * エラーメッセージをフォーマットする関数
 * @param error エラーオブジェクト
 * @returns フォーマットされたエラーメッセージ
 */
export const formatErrorMessage = (error: unknown): string => {
  return error instanceof Error
    ? `エラーが発生しました: ${error.message}`
    : `エラーが発生しました: ${String(error)}`;
};

/**
 * JSONを安全にパースする関数
 * @param data パースする文字列
 * @returns パース結果またはnull
 */
export const safeJsonParse = <T>(data: string): T | null => {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
};
