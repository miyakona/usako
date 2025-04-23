import { D1Database, LineRequestBody, LineResponseBody } from "../types";
import { DEFAULT_MESSAGE, LINE } from "../constants";
import { createLineResponse } from "./http";
import { safeOperation } from "./error";
import * as logger from "./logger";
import { getMessageFromDb } from "./database";

/**
 * D1からランダムなメッセージを取得し、LINE Messaging API形式のJSONオブジェクトを返す
 * @param db D1データベース
 * @param replyToken 返信用トークン
 * @returns LINE Messaging API形式のJSONオブジェクト
 */
export const getRandomMessageFromDB = async (
  db: D1Database,
  replyToken: string = LINE.DUMMY_TOKEN
): Promise<LineResponseBody> => {
  if (!db) {
    logger.warn("データベース接続がnullまたはundefined");
    return createLineResponse(DEFAULT_MESSAGE, replyToken);
  }

  const messageText = await getMessageFromDb(db);
  return createLineResponse(messageText, replyToken);
};

/**
 * LINEイベントからレスポンスを生成する共通関数
 * @param body LINEリクエストボディ
 * @param db D1データベース
 * @returns LINE Messaging API形式のレスポンス
 */
export const processLineEvents = async (
  body: LineRequestBody,
  db: D1Database
): Promise<LineResponseBody | Record<string, never>> => {
  logger.debug("LINE events processing", body);

  if (body.events && Array.isArray(body.events) && body.events.length > 0) {
    // replyTokenを取得（存在する場合）
    const event = body.events[0];
    const replyToken = event.replyToken || LINE.DUMMY_TOKEN;

    // イベントがメッセージの場合
    if (event.type === "message" && event.message?.type === "text") {
      logger.info(`Received message: ${event.message.text}`);

      // DBからランダムなメッセージを取得して応答
      logger.info("Getting random message from DB for message event");
      return await getRandomMessageFromDB(db, replyToken);
    }

    // その他のイベントではデータベースからランダムメッセージを取得
    logger.info(`Handling non-text event: ${event.type}`);
    return await getRandomMessageFromDB(db, replyToken);
  }

  logger.debug("No valid events found in request");
  return {};
};

/**
 * POSTリクエストのデータを安全に処理する共通関数
 * @param body LINEリクエストボディまたは文字列
 * @param db D1データベース
 * @returns 処理結果のJSONオブジェクト
 */
export const safeProcessLineEvents = async (
  body: LineRequestBody | string,
  db: D1Database
): Promise<LineResponseBody | Record<string, never>> => {
  logger.debug("Processing LINE request", body);

  return await safeOperation(
    async () => {
      const parsedBody =
        typeof body === "string" ? (JSON.parse(body) as LineRequestBody) : body;

      if (parsedBody) {
        return await processLineEvents(parsedBody, db);
      }
      return {};
    },
    {},
    "LINEイベント処理中にエラーが発生しました"
  );
};
