import { D1Database, Message, LineResponseBody } from "./types";
import { DEFAULT_MESSAGE } from "./constants";

/**
 * LINE Messaging API形式のレスポンス本文を作成する関数
 * @param text メッセージテキスト
 * @param replyToken 返信用トークン
 * @returns LINE Messaging API形式のレスポンス本文
 */
export const createLineResponse = (
  text: string,
  replyToken: string = "dummy-token"
): LineResponseBody => {
  return {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: text,
      },
    ],
  };
};

/**
 * データベースからメッセージを安全に取得する関数
 * @param db D1データベース
 * @returns メッセージ文字列またはデフォルトメッセージ
 */
const getMessageFromDb = async (db: D1Database): Promise<string> => {
  try {
    const query = "SELECT message FROM messages ORDER BY RANDOM() LIMIT 1";
    const { results } = await db.prepare(query).all();
    return results && results.length > 0 ? results[0].message : DEFAULT_MESSAGE;
  } catch (error) {
    console.error("Error fetching message from DB:", error);
    return formatErrorMessage(error);
  }
};

/**
 * D1からランダムなメッセージを取得し、LINE Messaging API形式のJSONオブジェクトを返す
 * @param db D1データベース
 * @param replyToken 返信用トークン
 * @returns LINE Messaging API形式のJSONオブジェクト
 */
export const getRandomMessageFromDB = async (
  db: D1Database,
  replyToken: string = "dummy-token"
): Promise<LineResponseBody> => {
  if (!db) {
    console.error("Database connection is null or undefined");
    return createLineResponse(DEFAULT_MESSAGE, replyToken);
  }

  try {
    const messageText = await getMessageFromDb(db);
    return createLineResponse(messageText, replyToken);
  } catch (error) {
    console.error("Error getting random message:", error);
    return createLineResponse(DEFAULT_MESSAGE, replyToken);
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
