import { ServerResponse } from "http";
import { LineResponseBody, LineMessageContent } from "../types";
import { CONTENT_TYPE, LINE } from "../constants";
import * as logger from "./logger";

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
  const responseBody =
    typeof message === "string" ? message : JSON.stringify(message);
  res.writeHead(status, headers);
  res.end(responseBody);

  logger.info(`Sent response with status ${status}`);
  logger.debug("Response body", message);
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

  const response = new Response(body, {
    status,
    headers,
  });

  logger.logResponse(status, headers, message);
  return response;
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

  const response = {
    replyToken: replyToken,
    messages: [message],
  };

  logger.debug("Created LINE response", response);
  return response;
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
      logger.info(`Sending LINE reply with token: ${responseBody.replyToken}`);
      logger.debug("LINE API request body", responseBody);
      logger.debug(
        `Using access token: ${
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
      logger.logResponse(response.status, response.headers, result);

      if (!response.ok) {
        logger.error(
          `LINE API error: ${response.status} ${response.statusText}`,
          result
        );
      }

      return response;
    } else {
      logger.info("Skipping LINE reply with dummy token");
      return new Response("Skipped with dummy token", { status: 200 });
    }
  } catch (error) {
    logger.error("Failed to send LINE reply", error);
    return new Response(`Failed to send reply: ${error}`, { status: 500 });
  }
};
