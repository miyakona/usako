import type { D1Database } from '../types/d1';

// 環境変数の型定義
export interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  DB: D1Database;
  ENVIRONMENT?: string;
  USER1_ID?: string;
  USER2_ID?: string;
}

// デフォルト環境変数
const DEFAULT_ENV: Partial<Env> = {
  ENVIRONMENT: 'development',
  LINE_CHANNEL_ACCESS_TOKEN: 'default_line_channel_access_token',
  LINE_CHANNEL_SECRET: 'default_line_channel_secret',
  USER1_ID: 'default_user1_id',
  USER2_ID: 'default_user2_id',
};

// 環境変数管理クラス
export class EnvConfig {
  private static instance: EnvConfig;
  private currentEnv: Env;

  private constructor() {
    this.currentEnv = DEFAULT_ENV as Env;
  }

  // シングルトンインスタンス取得
  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  // Cloudflare Workerの環境変数を設定
  public setCloudflareEnv(env: Env): void {
    this.currentEnv = {
      ...DEFAULT_ENV,
      ...env,
    };
  }

  // 環境変数の取得
  public getEnv(): Env {
    return this.currentEnv;
  }

  // 特定の環境変数を取得
  public get(key: keyof Env): string | D1Database | undefined {
    return this.currentEnv[key];
  }

  // 環境チェック
  public isProduction(): boolean {
    return this.currentEnv.ENVIRONMENT === 'production';
  }

  public isDevelopment(): boolean {
    return this.currentEnv.ENVIRONMENT === 'development';
  }
}

// デフォルトインスタンスをエクスポート
export const envConfig = EnvConfig.getInstance();

export function getEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません。`);
  }
  return value;
}

export const ENV = {
  LINE_CHANNEL_ACCESS_TOKEN: getEnv(ENV, 'LINE_CHANNEL_ACCESS_TOKEN'),
  LINE_CHANNEL_SECRET: getEnv(ENV, 'LINE_CHANNEL_SECRET'),
  USER_IDS: {
    USER1: getEnv(ENV, 'USER1_ID'),
    USER2: getEnv(ENV, 'USER2_ID')
  }
}; 