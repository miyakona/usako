// ユーティリティ関数をまとめてエクスポート
export * from "./logger";
export * from "./http";
export * from "./error";
export * from "./line";

/**
 * JSONを安全にパースする関数
 * @param data パースする文字列
 * @returns パース結果またはnull
 */
export const safeJsonParse = <T>(data: string): T | null => {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    // エラーロギングはimportしたlogger.errorを使用
    const { error: logError } = require("./logger");
    logError("JSONのパースに失敗しました", error);
    return null;
  }
};
