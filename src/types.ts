// Cloudflare D1の型定義
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  all(): Promise<{ results: any[] }>;
}

// 環境変数の型定義
export interface Env {
  DB: D1Database;
}

// メッセージの型定義
export interface Message {
  message: string;
}

// LINE Messaging APIからのイベント型定義
export interface LineEvent {
  type: string;
  replyToken?: string;
  message?: {
    text: string;
  };
  source?: {
    userId: string;
  };
}

// LINE Messaging APIからのリクエストボディ型定義
export interface LineRequestBody {
  events?: LineEvent[];
}

// LINE Messaging APIへのレスポンス型定義
export interface LineResponseBody {
  replyToken: string;
  messages: {
    type: string;
    text: string;
  }[];
}
