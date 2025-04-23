import { IncomingMessage, ServerResponse } from "http";
import { Env, D1Database, LineRequestBody, LineResponseBody } from "./types";
import { CONTENT_TYPE, LINE } from "./constants";
import {
  sendResponse,
  createCloudflareResponse,
  sendLineReply,
} from "./utils/http";
import { logRequest, debug, info, error } from "./utils/logger";
import { safeOperation } from "./utils/error";
import * as lineUtils from "./utils/line";

/**
 * GETリクエストのハンドラー
 * @param res レスポンスオブジェクト
 */
export const handleGetRequest = (res: ServerResponse): void => {
  sendResponse(res, 200, "Hello World!", CONTENT_TYPE.TEXT);
};

/**
 * POSTリクエストのハンドラー
 * @param req リクエストオブジェクト
 * @param res レスポンスオブジェクト
 * @param db D1データベース
 */
export const handlePostRequest = (
  req: IncomingMessage,
  res: ServerResponse,
  db: D1Database
): void => {
  let data = "";

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", async () => {
    // リクエストのログ出力
    logRequest(req.method || "POST", req.url || "/", req.headers, data);

    const responseMessage = await safeOperation(
      async () => await lineUtils.safeProcessLineEvents(data, db),
      {},
      "POSTリクエスト処理中にエラーが発生しました"
    );

    const hasContent = Object.keys(responseMessage).length > 0;
    sendResponse(
      res,
      200,
      hasContent ? responseMessage : "",
      hasContent ? CONTENT_TYPE.JSON : CONTENT_TYPE.TEXT
    );
  });
};

/**
 * Cloudflare Workersのリクエストハンドラー
 * @param request リクエストオブジェクト
 * @param env 環境変数
 * @returns レスポンスオブジェクト
 */
export const handleCloudflareRequest = async (
  request: Request,
  env: Env
): Promise<Response> => {
  // リクエストの詳細情報をログ出力
  logRequest(request.method, request.url, request.headers);

  if (request.method === "POST") {
    return await safeOperation(
      async () => {
        try {
          // リクエストボディをクローンして取得（JSONとしてパースする前にログ出力用）
          const clonedRequest = request.clone();
          const rawBody = await clonedRequest.text();
          debug("Raw request body", rawBody);

          // 元のリクエストからJSONを取得
          const body = (await request.json()) as LineRequestBody;

          // パース済みボディもログ出力
          debug("Parsed request body", body);

          // LINE.CHANNEL_ACCESS_TOKENに環境変数の値を設定
          LINE.CHANNEL_ACCESS_TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN;

          const responseData = await lineUtils.safeProcessLineEvents(
            body,
            env.DB
          );
          const hasContent = Object.keys(responseData).length > 0;

          // レスポンスのログ出力
          debug("Response data", hasContent ? responseData : "Empty response");

          // 実際にLINE APIに返信を送信
          if (
            hasContent &&
            "replyToken" in responseData &&
            responseData.replyToken !== LINE.DUMMY_TOKEN
          ) {
            const lineApiResponse = await sendLineReply(
              responseData as LineResponseBody
            );
            info(
              `LINE API call complete with status: ${lineApiResponse.status}`
            );
          }

          // Webhookには常に200 OKを返す（LINE APIの仕様）
          return createCloudflareResponse(200, "");
        } catch (err) {
          error("Failed to process request", err);
          return createCloudflareResponse(200, "");
        }
      },
      createCloudflareResponse(200, ""),
      "Cloudflareリクエスト処理中にエラーが発生しました"
    );
  }

  // GETリクエストの応答
  info("Handling GET request");
  return createCloudflareResponse(200, "Hello World!", CONTENT_TYPE.TEXT);
};
