import { Given, When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { APIRequestContext, request } from "@playwright/test";
import { CustomWorld } from "../support/world";

// デフォルトのタイムアウト設定
setDefaultTimeout(30 * 1000);

// 前提条件のステップ
Given("サーバーが起動していること", async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: this.baseURL,
  });
});

// メッセージを送信するステップ
When(
  "「{string}」と話しかける",
  async function (this: CustomWorld, message: string) {
    if (!this.apiContext) {
      throw new Error("API context is not initialized");
    }

    // LINE Messaging API形式のリクエストボディ
    const requestBody = {
      events: [
        {
          type: "message",
          replyToken: "dummy-token",
          message: {
            text: message,
          },
          source: {
            userId: "dummy-user",
          },
        },
      ],
    };

    // APIリクエストを送信
    this.response = await this.apiContext.post("/", {
      data: requestBody,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
);

// レスポンス確認のステップ
Then("ランダムなメッセージを送ってくる", async function (this: CustomWorld) {
  if (!this.response) {
    throw new Error("Response is not available");
  }

  // ステータスコードが200であることを確認
  if (this.response.status() !== 200) {
    throw new Error(
      `Expected response status to be 200 but got ${this.response.status()}`
    );
  }

  // レスポンス本文を取得して確認
  const responseText = await this.response.text();

  // レスポンス本文が空ではないことを確認
  if (!responseText) {
    throw new Error("Expected response body not to be empty");
  }
});
