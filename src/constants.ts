// デフォルト設定
export const DEFAULT_MESSAGE = "こんにちは！";
export const DEFAULT_PORT = 8787;

// コンテンツタイプ定数
export const CONTENT_TYPE = {
  TEXT: { "Content-Type": "text/plain" },
  JSON: { "Content-Type": "application/json" },
};

// データベース関連定数
export const DB = {
  QUERY: {
    RANDOM_MESSAGE: "SELECT message FROM messages ORDER BY RANDOM() LIMIT 1",
  },
};

// LINE関連定数
export const LINE = {
  DUMMY_TOKEN: "dummy-token",
  // process.envに依存せず、Cloudflare Workersの環境変数を後で取得するための設定
  CHANNEL_ACCESS_TOKEN: "",
};

// エラーメッセージ定数
export const ERROR = {
  DB_CONNECTION: "Database connection is null or undefined",
  FETCHING_MESSAGE: "Error fetching message from DB",
  PROCESSING_LINE_EVENTS: "Error processing LINE events",
  PARSING_JSON: "Error parsing JSON",
  POST_REQUEST: "Error in POST request handler",
  CLOUDFLARE_REQUEST: "Error handling POST request",
};
