import { D1Database } from "../types";
import { DEFAULT_MESSAGE, DB } from "../constants";
import * as logger from "./logger";

/**
 * データベースからメッセージを安全に取得する関数
 * @param db D1データベース
 * @returns メッセージ文字列またはデフォルトメッセージ
 */
export const getMessageFromDb = async (db: D1Database): Promise<string> => {
  try {
    const { results } = await db.prepare(DB.QUERY.RANDOM_MESSAGE).all();
    return results && results.length > 0 ? results[0].message : DEFAULT_MESSAGE;
  } catch (error) {
    logger.error("データベースからのメッセージ取得に失敗しました", error);
    return DEFAULT_MESSAGE;
  }
};
