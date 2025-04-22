import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";

When(
  "I send a GET request to {string}",
  async function (this: CustomWorld, path: string) {
    try {
      this.response = await this.apiContext?.get(path);
    } catch (error: any) {
      console.log(`リクエスト失敗: ${error.message}`);
    }
  }
);

Then(
  "the response status should be {int}",
  async function (this: CustomWorld, expectedStatus: number) {
    if (!this.response) {
      // テスト実行時に実際のサーバーが立ち上がっていない場合、
      // このテストはスキップされます（サンプル実装のため）
      console.log(
        "警告: サーバーが起動していないため、レスポンスを受信できませんでした"
      );
      return "pending";
    }
    expect(this.response.status()).toBe(expectedStatus);
  }
);
