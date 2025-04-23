/**
 * ロギングユーティリティ
 * アプリケーション全体で統一されたログ出力の形式とレベルを提供します
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// デフォルトのログレベルを設定
let currentLogLevel: LogLevel = LogLevel.INFO;

/**
 * ログレベルを設定する
 * @param level 設定するログレベル
 */
export const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

/**
 * ログメッセージを整形する
 * @param level ログレベル
 * @param message ログメッセージ
 * @param data 追加データ
 * @returns 整形されたログメッセージ
 */
const formatLogMessage = (
  level: string,
  message: string,
  data?: any
): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}${
    data ? ` ${JSON.stringify(data)}` : ""
  }`;
};

/**
 * 指定されたレベルでログを出力する
 * @param level ログレベル
 * @param message ログメッセージ
 * @param data 追加データ
 */
const log = (
  level: LogLevel,
  levelStr: string,
  message: string,
  data?: any
): void => {
  if (level >= currentLogLevel) {
    const formattedMessage = formatLogMessage(levelStr, message, data);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
};

/**
 * デバッグレベルのログを出力
 * @param message ログメッセージ
 * @param data 追加データ
 */
export const debug = (message: string, data?: any): void => {
  log(LogLevel.DEBUG, "DEBUG", message, data);
};

/**
 * 情報レベルのログを出力
 * @param message ログメッセージ
 * @param data 追加データ
 */
export const info = (message: string, data?: any): void => {
  log(LogLevel.INFO, "INFO", message, data);
};

/**
 * 警告レベルのログを出力
 * @param message ログメッセージ
 * @param data 追加データ
 */
export const warn = (message: string, data?: any): void => {
  log(LogLevel.WARN, "WARN", message, data);
};

/**
 * エラーレベルのログを出力
 * @param message ログメッセージ
 * @param error エラーオブジェクト
 */
export const error = (message: string, error?: any): void => {
  log(LogLevel.ERROR, "ERROR", message, error);
};

/**
 * HTTPリクエストに関する情報をログ出力
 * @param method リクエストメソッド
 * @param url リクエストURL
 * @param headers リクエストヘッダー
 * @param body リクエストボディ
 */
export const logRequest = (
  method: string,
  url: string,
  headers: Headers | Record<string, string | string[] | undefined>,
  body?: any
): void => {
  const headersObj =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : headers;

  debug(`REQUEST ${method} ${url}`);
  debug("HEADERS", headersObj);

  if (body) {
    debug("BODY", typeof body === "string" ? body : JSON.stringify(body));
  }
};

/**
 * HTTPレスポンスに関する情報をログ出力
 * @param status レスポンスステータス
 * @param headers レスポンスヘッダー
 * @param body レスポンスボディ
 */
export const logResponse = (
  status: number,
  headers?: Headers | Record<string, string | string[] | undefined>,
  body?: any
): void => {
  const headersObj =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : headers;

  debug(`RESPONSE ${status}`);

  if (headers) {
    debug("RESPONSE HEADERS", headersObj);
  }

  if (body) {
    debug(
      "RESPONSE BODY",
      typeof body === "string" ? body : JSON.stringify(body)
    );
  }
};

// ログレベル定数をエクスポート
export { LogLevel };
