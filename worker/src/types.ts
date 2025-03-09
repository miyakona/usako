// Cloudflare Workers用のExecutionContext型定義を追加
export interface ExecutionContext {
  // 必要に応じて、ExecutionContextの具体的な型を定義
  env: Env;
  // その他の必要なプロパティ
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Cloudflare Workers用のEnvironment型定義を追加
export interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  SPREADSHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_KEY: string;
  GOOGLE_SHEETS_CREDENTIALS: string;
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
}

// LINEウェブフックリクエストの型定義を追加
export interface LineWebhookRequest {
  events: LineEvent[];
}

// LINEイベントの型定義を追加
export interface LineEvent {
  type: 'message' | 'postback';
  replyToken?: string;
  message?: LineMessage;
  postback?: {
    data: string;
  };
  source?: {
    type: string;
    userId: string;
  };
}

// 追加の型定義
export interface LineMessage {
  type: string;
  text?: string;
  altText?: string;
  template?: {
    type: string;
    altText?: string;
    text?: string;
    [key: string]: any;
  };
}

export interface LineAction {
  type: string;
  label: string;
  data: string;
}

export interface LineColumn {
  title: string;
  text: string;
}

// トークンレスポンスの型定義
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Message {
  title: string;
  text: string;
}

export interface TokenValidationResponse {
  audience?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
} 