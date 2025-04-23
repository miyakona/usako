import {
  D1Database,
  Message,
  LineResponseBody,
  LineMessageContent,
} from "./types";
import { DEFAULT_MESSAGE, CONTENT_TYPE, LINE, DB, ERROR } from "./constants";
import { ServerResponse } from "http";

/**
 * アプリケーション全体で統一されたエラーハンドリングを提供
 * @param operation 実行する操作
 * @param fallback 失敗時のフォールバック値
 * @param logMessage エラー時のログメッセージ
 * @returns 操作の結果またはフォールバック値
 */
export const safeOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  logMessage: string = "操作に失敗しました"
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${logMessage}:`, error);
    return fallback;
  }
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
    console.error(ERROR.PARSING_JSON, error);
    return null;
  }
};

/**
 * レスポンスを返す共通関数
 * @param res レスポンスオブジェクト
 * @param status ステータスコード
 * @param message メッセージまたはJSONオブジェクト
 * @param headers ヘッダー
 */
export const sendResponse = (
  res: ServerResponse,
  status: number = 200,
  message: string | object = "",
  headers: Record<string, string> = CONTENT_TYPE.TEXT
): void => {
  res.writeHead(status, headers);
  res.end(typeof message === "string" ? message : JSON.stringify(message));
};

/**
 * Cloudflare Workersのレスポンスを作成する共通関数
 * @param status ステータスコード
 * @param message メッセージまたはJSONオブジェクト
 * @param headers ヘッダー
 * @returns Responseオブジェクト
 */
export const createCloudflareResponse = (
  status: number = 200,
  message: string | object = "",
  headers: Record<string, string> = CONTENT_TYPE.TEXT
): Response => {
  const body = typeof message === "string" ? message : JSON.stringify(message);
  return new Response(body, {
    status,
    headers,
  });
};

/**
 * LINE Messaging API形式のレスポンス本文を作成する関数
 * @param text メッセージテキスト
 * @param replyToken 返信用トークン
 * @returns LINE Messaging API形式のレスポンス本文
 */
export const createLineResponse = (
  text: string,
  replyToken: string = LINE.DUMMY_TOKEN
): LineResponseBody => {
  const message: LineMessageContent = {
    type: "text",
    text: text,
  };

  return {
    replyToken: replyToken,
    messages: [message],
  };
};

/**
 * データベースからメッセージを安全に取得する関数
 * @param db D1データベース
 * @returns メッセージ文字列またはデフォルトメッセージ
 */
const getMessageFromDb = async (db: D1Database): Promise<string> => {
  try {
    const { results } = await db.prepare(DB.QUERY.RANDOM_MESSAGE).all();
    return results && results.length > 0 ? results[0].message : DEFAULT_MESSAGE;
  } catch (error) {
    console.error(ERROR.FETCHING_MESSAGE, error);
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
  replyToken: string = LINE.DUMMY_TOKEN
): Promise<LineResponseBody> => {
  if (!db) {
    console.error(ERROR.DB_CONNECTION);
    return createLineResponse(DEFAULT_MESSAGE, replyToken);
  }

  const messageText = await getMessageFromDb(db);
  return createLineResponse(messageText, replyToken);
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
 * LINE Messaging APIに返信メッセージを送信する関数
 * @param responseBody LINE Messaging API形式のレスポンス本文
 * @returns 送信結果のPromise
 */
export const sendLineReply = async (
  responseBody: LineResponseBody
): Promise<Response> => {
  try {
    // replyTokenがデフォルト値でない場合のみ送信
    if (responseBody.replyToken !== LINE.DUMMY_TOKEN) {
      console.log(
        `[LINE API] Sending reply with token: ${responseBody.replyToken}`
      );
      console.log(`[LINE API] Request body: ${JSON.stringify(responseBody)}`);
      console.log(
        `[LINE API] Using access token: ${
          LINE.CHANNEL_ACCESS_TOKEN ? "設定済み" : "未設定"
        }`
      );

      const response = await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE.CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(responseBody),
      });

      const result = await response.text();
      console.log(`[LINE API] Response status: ${response.status}`);
      console.log(
        `[LINE API] Response headers: ${JSON.stringify([
          ...response.headers.entries(),
        ])}`
      );
      console.log(`[LINE API] Response body: ${result}`);

      if (!response.ok) {
        console.error(
          `[LINE API] Error: ${response.status} ${response.statusText} - ${result}`
        );
      }

      return response;
    } else {
      console.log("[LINE API] Skipping reply with dummy token");
      return new Response("Skipped with dummy token", { status: 200 });
    }
  } catch (error) {
    console.error(`[LINE API] Failed to send reply: ${error}`);
    return new Response(`Failed to send reply: ${error}`, { status: 500 });
  }
};
