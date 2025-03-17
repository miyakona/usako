// 設計方針
// 1. モジュラーアーキテクチャ
// 2. TypeScriptベース
// 3. クリーンアーキテクチャの原則を適用
// 4. 依存性注入
// 5. 環境変数とセキュリティの重視

// src/types/index.ts
export interface LineEvent {
  type: 'message' | 'postback';
  replyToken: string;
  message?: { text: string };
  postback?: { data: string };
  source: { userId: string };
}

export interface LineMessage {
  type: 'text' | 'template';
  text?: string;
  template?: {
    type: 'buttons' | 'carousel';
    columns?: any[];
    actions?: any[];
  };
}

// src/config/env.ts
export const ENV = {
  LINE_CHANNEL_ACCESS_TOKEN: env('LINE_CHANNEL_ACCESS_TOKEN'),
  LINE_CHANNEL_SECRET: env('LINE_CHANNEL_SECRET'),
  USER_IDS: {
    USER1: env('USER1_ID'),
    USER2: env('USER2_ID')
  }
}

// src/services/line-service.ts
export class LineService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async replyMessage(replyToken: string, message: LineMessage) {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${this.accessToken}
      },
      body: JSON.stringify({ replyToken, messages: [message] })
    });
    return response.json();
  }

  async pushMessage(userId: string, message: LineMessage) {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${this.accessToken}
      },
      body: JSON.stringify({ to: userId, messages: [message] })
    });
    return response.json();
  }
}

// src/repositories/d1-repository.ts
export class D1Repository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // 家計簿関連
  async getVariableCosts(year: number, month: number) {
    return this.db.prepare(
      'SELECT * FROM variable_costs WHERE year = ? AND month = ?'
    ).bind(year, month).all();
  }

  async addVariableCost(data: any) {
    return this.db.prepare(
      'INSERT INTO variable_costs (year, month, category, amount, user) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.year, data.month, data.category, data.amount, data.user
    ).run();
  }

  // 家事関連
  async getHouseworkList(userId: string, year: number, month: number) {
    return this.db.prepare(
      'SELECT * FROM housework WHERE user_id = ? AND year = ? AND month = ?'
    ).bind(userId, year, month).all();
  }

  // 買い物リスト関連
  async getPurchaseList() {
    return this.db.prepare('SELECT * FROM purchase_list WHERE status = "pending"').all();
  }

  async addPurchaseItem(item: string) {
    return this.db.prepare(
      'INSERT INTO purchase_list (item, status) VALUES (?, "pending")'
    ).bind(item).run();
  }
}

// src/handlers/message-handler.ts
export class MessageHandler {
  private lineService: LineService;
  private d1Repository: D1Repository;

  constructor(lineService: LineService, d1Repository: D1Repository) {
    this.lineService = lineService;
    this.d1Repository = d1Repository;
  }

  async handleMessage(event: LineEvent) {
    const messageText = event.message?.text || '';

    switch (messageText) {
      case '家計簿':
        return this.handleAccountBookCommand(event);
      case '家事管理':
        return this.handleHouseworkCommand(event);
      case '買い出しリスト':
        return this.handlePurchaseListCommand(event);
      default:
        return this.handleDefaultMessage(event);
    }
  }

  private async handleAccountBookCommand(event: LineEvent) {
    // 家計簿関連の処理
  }

  private async handleHouseworkCommand(event: LineEvent) {
    // 家事管理関連の処理
  }

  private async handlePurchaseListCommand(event: LineEvent) {
    // 買い出しリスト関連の処理
  }

  private async handleDefaultMessage(event: LineEvent) {
    // デフォルトのメッセージ処理
  }
}

// src/index.ts (Cloudflare Worker)
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const lineService = new LineService(ENV.LINE_CHANNEL_ACCESS_TOKEN);
    const d1Repository = new D1Repository(env.DB);
    const messageHandler = new MessageHandler(lineService, d1Repository);

    if (request.method === 'POST') {
      const payload = await request.json();
      const events: LineEvent[] = payload.events;

      for (const event of events) {
        switch (event.type) {
          case 'message':
            await messageHandler.handleMessage(event);
            break;
          case 'postback':
            // ポストバックイベントの処理
            break;
        }
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
}

// wrangler.toml
// [vars]
// LINE_CHANNEL_ACCESS_TOKEN = "..."
// LINE_CHANNEL_SECRET = "..."
// USER1_ID = "..."
// USER2_ID = "..."

// D1データベーススキーマ
// CREATE TABLE variable_costs (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   year INTEGER,
//   month INTEGER,
//   category TEXT,
//   amount REAL,
//   user TEXT
// );

// CREATE TABLE housework (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   user_id TEXT,
//   year INTEGER,
//   month INTEGER,
//   task TEXT,
//   status TEXT
// );

// CREATE TABLE purchase_list (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   item TEXT,
//   status TEXT DEFAULT 'pending'
// );