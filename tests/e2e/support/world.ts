import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { APIRequestContext, APIResponse } from "@playwright/test";

/**
 * カスタムWorld インターフェース定義
 */
export interface CustomWorld extends World {
  apiContext?: APIRequestContext;
  response?: APIResponse;
  baseURL: string;
}

/**
 * Playwright用のWorldクラス
 */
class PlaywrightWorld extends World implements CustomWorld {
  baseURL: string;
  apiContext?: APIRequestContext;
  response?: APIResponse;

  constructor(options: IWorldOptions) {
    super(options);
    // テスト用サーバーのベースURL
    this.baseURL = "http://localhost:8787";
  }
}

setWorldConstructor(PlaywrightWorld);
