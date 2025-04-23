import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import { startServer } from "../../../src/server";
import { CustomWorld } from "./world";
import * as http from "http";
import { Server } from "http";

// テスト用サーバーのインスタンス
let server: Server;

/**
 * テストスイート開始前にサーバーを起動する
 */
BeforeAll(async function () {
  // サーバーを起動する前に既存のサーバーがないか確認
  try {
    const checkServer = await fetch("http://localhost:8787/", {
      method: "GET",
      signal: AbortSignal.timeout(1000), // 1秒でタイムアウト
    });
    console.log("既存のサーバーを検出: ", checkServer.status);
  } catch (error) {
    // エラーが発生した場合、サーバーが起動していないと判断
    console.log(
      "既存のサーバーは検出されませんでした。新しいサーバーを起動します。"
    );
    server = await startServer();
    console.log("テスト用サーバーを起動しました");
  }
});

/**
 * 各シナリオ前にAPIコンテキストを設定
 */
Before(async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: this.baseURL,
    timeout: 5000, // タイムアウトを短く設定
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
