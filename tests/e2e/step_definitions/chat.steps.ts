import { Given, When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { APIRequestContext, request } from "@playwright/test";

// デフォルトのタイムアウト設定（必要に応じて調整）
setDefaultTimeout(30 * 1000);

let apiContext: APIRequestContext;

// 前提条件のステップ（サーバー起動確認は省略してno-opとする）
Given("サーバーが起動していること", async function () {
  // サーバー起動確認は省略（no-op）
  apiContext = await request.newContext({
    baseURL: "http://localhost:8787",
  });
});

// メッセージを送信するステップ
When("「{string}」と話しかける", async function (message: string) {
  // LINE Messaging API形式のリクエストボディを作成
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
  this.response = await apiContext.post("/", {
    data: requestBody,
    headers: {
      "Content-Type": "application/json",
    },
  });
});

// レスポンス確認のステップ
Then("ランダムなメッセージを送ってくる", async function () {
  // ステータスコードが200であることを確認
  if (this.response.status() !== 200) {
    throw new Error(
      `Expected response status to be 200 but got ${this.response.status()}`
    );
  }

  // レスポンス本文を取得して確認
  const text = await this.response.text();

  // レスポンス本文が空ではないことを確認
  if (text === "") {
    throw new Error("Expected response body not to be empty");
  }
});
