// デフォルトメッセージ
export const DEFAULT_MESSAGE = "こんにちは！";

// サーバー設定
export const DEFAULT_PORT = 8787;

// レスポンスヘッダー
export const CONTENT_TYPE_TEXT = { "Content-Type": "text/plain" };
export const CONTENT_TYPE_JSON = { "Content-Type": "application/json" };

// データベース関連
export const DB_QUERY_RANDOM_MESSAGE =
  "SELECT message FROM messages ORDER BY RANDOM() LIMIT 1";

// LINE関連
export const LINE_DUMMY_TOKEN = "dummy-token";

// エラーメッセージ
export const ERROR_DB_CONNECTION = "Database connection is null or undefined";
export const ERROR_FETCHING_MESSAGE = "Error fetching message from DB";
export const ERROR_PROCESSING_LINE_EVENTS = "Error processing LINE events";
export const ERROR_PARSING_JSON = "Error parsing JSON";
export const ERROR_POST_REQUEST = "Error in POST request handler";
export const ERROR_CLOUDFLARE_REQUEST = "Error handling POST request";
