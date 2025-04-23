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
  LINE_CHANNEL_ACCESS_TOKEN: string;
}

// メッセージの型定義
export interface Message {
  message: string;
}

// LINE Messaging APIからのイベント型定義
export interface LineEvent {
  type: string;
  replyToken?: string;
  message?: LineMessage;
  source?: LineSource;
}

// LINE メッセージの型定義
export interface LineMessage {
  type: string;
  text: string;
  id?: string;
}

// LINE ソースの型定義
export interface LineSource {
  type: "user" | "group" | "room";
  userId?: string;
  groupId?: string;
  roomId?: string;
}

// LINE Messaging APIからのリクエストボディ型定義
export interface LineRequestBody {
  events?: LineEvent[];
  destination?: string;
}

// LINE Messaging APIへのレスポンス型定義
export interface LineResponseBody {
  replyToken: string;
  messages: LineMessageContent[];
}

// LINE メッセージコンテンツの型定義
export interface LineMessageContent {
  type:
    | "text"
    | "template"
    | "image"
    | "video"
    | "audio"
    | "location"
    | "sticker";
  text?: string;
  [key: string]: any; // その他のプロパティに対応
}
