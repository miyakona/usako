// LINE関連の型
export interface LineEvent {
  type: string;
  replyToken?: string;
  source?: {
    type: string;
    userId?: string;
  };
  message?: {
    type: string;
    text: string;
  };
  postback?: {
    data: string;
  };
}

export interface LineMessage {
  type: string;
  text?: string;
  altText?: string;
  template?: {
    type: string;
    thumbnailImageUrl?: string;
    imageAspectRatio?: string;
    imageSize?: string;
    title?: string;
    text?: string;
    actions?: LineAction[];
    columns?: LineColumn[];
  };
}

export interface LineAction {
  type: string;
  label: string;
  text?: string;
  data?: string;
}

export interface LineColumn {
  thumbnailImageUrl?: string;
  title?: string;
  text: string;
  actions: LineAction[];
}

export interface LineWebhookRequest {
  events: LineEvent[];
}

// Google Sheets関連の型
export interface SheetData {
  [key: string]: any;
}

// 環境変数の型
export interface Env {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  GOOGLE_SERVICE_ACCOUNT_KEY: string;
  SPREADSHEET_ID: string;
} 