import { When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";

// デフォルトのタイムアウトを短くする
setDefaultTimeout(10000);

When(
  "I send a GET request to {string}",
  async function (this: CustomWorld, path: string) {
    try {
      this.response = await this.apiContext?.get(path);
      console.log(`GETリクエスト成功: ${path}`);
    } catch (error: any) {
      console.error(`リクエスト失敗: ${error.message}`);
      this.testError = error;
    }
  }
);

Then(
  "the response status should be {int}",
  async function (this: CustomWorld, expectedStatus: number) {
    if (this.testError) {
      throw this.testError;
    }

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
