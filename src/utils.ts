import { D1Database, Message } from "./types";
import { DEFAULT_MESSAGE } from "./constants";

/**
 * D1からランダムなメッセージを取得し、LINE Messaging API形式のJSONオブジェクトを返す
 * @param db D1データベース
 * @param replyToken 返信用トークン
 * @returns LINE Messaging API形式のJSONオブジェクト
 */
export const getRandomMessageFromDB = async (
  db: D1Database,
  replyToken: string = "dummy-token"
): Promise<object> => {
  try {
    // ランダムな1つのメッセージを取得
    const { results } = await db
      .prepare("SELECT message FROM messages ORDER BY RANDOM() LIMIT 1")
      .all();

    // メッセージ内容
    const messageText =
      results && results.length > 0 ? results[0].message : DEFAULT_MESSAGE;

    // LINE Messaging API形式のJSONオブジェクトを作成
    return {
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: messageText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching message from DB:", error);
    // エラーの場合もLINE Messaging API形式のJSONオブジェクトを返す
    return {
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: formatErrorMessage(error),
        },
      ],
    };
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
