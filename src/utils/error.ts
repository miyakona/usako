import * as logger from "./logger";
import { ERROR } from "../constants";

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
    logger.error(logMessage, error);
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
    logger.error(ERROR.PARSING_JSON, error);
    return null;
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
 * エラーの詳細を標準化して返す関数
 * @param error エラーオブジェクト
 * @param context コンテキスト情報
 * @returns 標準化されたエラー情報
 */
export const normalizeError = (
  error: unknown,
  context: string = ""
): Record<string, any> => {
  const errorObj: Record<string, any> = {
    message: formatErrorMessage(error),
    context,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof Error) {
    errorObj.name = error.name;
    errorObj.stack = error.stack;
  }

  return errorObj;
};

/**
 * 指定されたエラーを発生させる
 * @param message エラーメッセージ
 * @param context コンテキスト情報
 */
export const throwError = (message: string, context: string = ""): never => {
  const fullMessage = context ? `${message} (${context})` : message;
  logger.error(fullMessage);
  throw new Error(fullMessage);
};
