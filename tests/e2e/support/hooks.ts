import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import { startServer } from "../../../src/server";
import { CustomWorld } from "./world";

// テスト用サーバーのインスタンス
let server: ReturnType<typeof startServer>;

/**
 * テストスイート開始前にサーバーを起動
 */
BeforeAll(async function () {
  server = startServer();
  console.log("テスト用サーバーを起動しました");
});

/**
 * 各シナリオ前にAPIコンテキストを設定
 */
Before(async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: this.baseURL,
  });
});

/**
 * 各シナリオ後にAPIコンテキストをクローズ
 */
After(async function (this: CustomWorld) {
  if (this.apiContext) {
    await this.apiContext.dispose();
  }
});

/**
 * テストスイート終了後にサーバーを停止
 */
AfterAll(async function () {
  if (server) {
    server.close();
    console.log("テスト用サーバーを停止しました");
  }
});
