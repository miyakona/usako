# 🚀 GAS to Cloudflare Worker Migration Analysis

## **📝 概要**
このプロジェクトは **Google Apps Script (GAS)** で実装されていたが、  
**Cloudflare Worker + D1** に移行する。

---

## **🗂 移行前（GAS）の機能詳細**
ここでは、GASの各ファイルの詳細な処理を記録しておく。  
移行作業中に **「どの機能がまだCloudflare Workerに再現されていないか」** のチェックに使用する。

### main.js
- **役割**: LINEのWebhookを受信し、イベントに応じた処理を行う。
- **主要な関数**:
  - `doPost(e)`: Webhookイベントを受信し、`handlePostback_`または`handleMessage_`を呼び出す。
  - `handlePostback_(replyToken, data, user_id)`: ポストバックイベントに応じたメッセージを生成し返信。
  - `handleMessage_(messageText, replyToken)`: メッセージに応じたテンプレートメッセージやテキストを返信。
- **依存関係**: `LineMessagingApi`, `AccountBook`, `Housework`, `Chat`, `Purchase`
- **GAS特有のAPI**: `Logger.log`
- **全体の処理フロー**: LINEからのメッセージを受け取り、イベントタイプに応じて適切な処理を行い、LINEに返信。

### lineMessagingApi.js
- **役割**: LINE Messaging APIとの通信を行う。
- **主要な関数**:
  - `constructor()`: チャンネルアクセストークンを初期化。
  - `pushAll(text)`: 全ユーザーにプッシュ通知を送信。
  - `replyText(replyToken, text)`: テキストメッセージを返信。
  - `replyTemplateButton(replyToken, altText, options)`: ボタンテンプレートメッセージを返信。
  - `replyTemplateCarousel(replyToken, columns)`: カルーセルテンプレートメッセージを返信。
  - `reply(postData)`: LINEに返信を送信。
  - `push(text, to)`: 指定ユーザーにプッシュメッセージを送信。
  - `getOptions(postData)`: APIリクエストの共通設定を取得。
- **依存関係**: `PropertiesService`, `UrlFetchApp`
- **GAS特有のAPI**: `PropertiesService`, `UrlFetchApp`, `Logger.log`

### accountBook.js
- **役割**: 家計簿データの管理を行う。
- **主要な関数**:
  - `constructor()`: 各種シートやプロパティを初期化。
  - `getTemplateColumn()`: チュートリアル用のテンプレートデータを取得。
  - `getButtonTemplateAction()`: 家計簿管理で使用するボタンテンプレートを取得。
  - `getMessage(action)`: 指定されたアクションに応じたメッセージを返す。
  - `getReported()`: 報告済みの家計を取得。
  - `getSummary()`: 支払いサマリーを取得。
  - `getPayment(variableCost, fixedCost)`: 支払い額を計算。
  - `getDetail(variableCost, fixedCost)`: 支払いの詳細を取得。
  - `getVariableCost()`: 変動費を取得。
  - `getFixedCost()`: 固定費を取得。
  - `getSummarySheet()`: サマリシートを取得。
- **依存関係**: `SpreadsheetApp`, `PropertiesService`
- **GAS特有のAPI**: `SpreadsheetApp`, `PropertiesService`, `Logger.log`

### chat.js
- **役割**: チャット機能を提供する。
- **主要な関数**:
  - `constructor()`: チャット用のシートと画像URLを初期化。
  - `getTemplateColumn()`: チュートリアル用のテンプレートデータを取得。
  - `getMessage()`: ランダムにメッセージを取得。
- **依存関係**: `SpreadsheetApp`, `PropertiesService`, `Utilities`
- **GAS特有のAPI**: `SpreadsheetApp`, `PropertiesService`, `Utilities`, `Logger.log`

### commandBase.js
- **役割**: コマンド処理の基底クラス。
- **主要な関数**:
  - `constructor(name)`: コマンドの名前を初期化。
  - `main()`: バッチ処理を実行し、エラーが発生した場合は通知。
  - `notice(errorMessage, stack)`: エラーメッセージとスタックトレースをログに記録し、LINEに通知。
  - `run()`: 実際の処理を行うメソッドで、サブクラスでオーバーライドされることを想定。
- **依存関係**: `LineMessagingApi`
- **GAS特有のAPI**: `Logger.log`

### housework.js
- **役割**: 家事管理を行う。
- **主要な関数**:
  - `constructor()`: 家事管理用のシートやプロパティを初期化。
  - `getTemplateColumn()`: チュートリアル用のテンプレートデータを取得。
  - `getButtonTemplateAction()`: 家事管理で使用するボタンテンプレートを取得。
  - `getMessage(action, userId)`: アクションに応じたメッセージを取得。
  - `getDoneList(userId)`: 実行済の家事リストを取得。
  - `getSheet()`: 家事報告のシートを取得。
  - `getUser1Name()`, `getUser2Name()`: ユーザーの名前を取得。
  - `getGraph()`: グラフのURLを取得。
- **依存関係**: `SpreadsheetApp`, `PropertiesService`
- **GAS特有のAPI**: `SpreadsheetApp`, `PropertiesService`, `Logger.log`

### purchase.js
- **役割**: 購入管理を行う。
- **主要な関数**:
  - `constructor()`: 買い出しリスト用のシートと画像URLを初期化。
  - `getTemplateColumn()`: チュートリアル用のテンプレートデータを取得。
  - `getMessage(message)`: 受信したメッセージに応じて、リストの取得、追加、削除を行う。
  - `getList()`: 買い出しリストを取得。
  - `deleteAll()`: リストにあるすべての品目を削除。
  - `delete(target)`: 指定された品目をリストから削除。
  - `add(target)`: 指定された品目をリストに追加。
  - `getSheet()`: 買い出しリストのシートを取得。
- **依存関係**: `SpreadsheetApp`, `PropertiesService`
- **GAS特有のAPI**: `SpreadsheetApp`, `PropertiesService`, `Logger.log`

### GAS 特有の API
- `SpreadsheetApp` → Cloudflare D1 に移行
- `UrlFetchApp` → fetch() に変更
- `PropertiesService` → 環境変数に変更

---

## **🚀 移行後（Cloudflare Worker + D1）**
Cloudflare Worker + D1 への移行後の構成。

```
.
├── src/
│   ├── index.ts                  # Cloudflare Workerエントリーポイント（main.js を置き換え）
│   ├── handlers/
│   │   ├── message-handler.ts     # メッセージ処理（housework.js, purchase.js の処理を統合）
│   ├── repositories/
│   │   ├── d1-repository.ts       # D1データベース処理（accountBook.js の処理を統合）
│   ├── services/
│   │   ├── line-service.ts        # LINE API通信（lineMessagingApi.js を置き換え）
│   ├── config/
│   │   ├── env.ts                 # 環境変数管理（config.js を置き換え）
│   ├── batch/
│   │   ├── commandBase.ts          # バッチ処理の基底クラス（commandBase.js を移行）
│   │   ├── scheduled-tasks.ts      # 定期実行タスク（移行予定）
├── tests/
│   ├── unit/
│   │   ├── message-handler.test.ts  # メッセージ処理の単体テスト
│   │   ├── d1-repository.test.ts    # D1リポジトリの単体テスト
│   │   ├── line-service.test.ts     # LINE APIの単体テスト
│   ├── integration/
│   │   ├── workflow.test.ts         # 全体の動作テスト
│   ├── utils/
│   │   ├── helper.ts               # ユーティリティ関数（例: 日付フォーマット、ログ出力など）
│   │   ├── logger.ts               # ログ管理（Cloudflare Worker でのエラーハンドリング用）
├── migrations/
│   ├── 001_init.sql              # 初期テーブル作成（variable_costs, housework, purchase_list）
│   ├── 002_add_indexes.sql       # パフォーマンス向上のためのインデックス追加
├── wrangler.toml                 # Cloudflare設定
├── package.json                  # パッケージ管理
└── vitest.config.ts               # テスト設定（Vitest）
```


---

## **📌 変更履歴**
| 日付 | 変更内容 |
|------|---------|
| 2025/03/18 | **Cloudflare Worker の基本動作を確認**（LINE Messaging API との疎通確認） |
| 2025/03/18 | **Cloudflare Worker のレスポンスを確認**（固定メッセージを返す形でテスト） |
| 2025/03/18 | **D1 との疎通確認は未完了**（データの読み書きテストは未実施） |
| 2025/03/18 | **GAS のコード移行は未着手**（今後の対応として記載） |
| 2025/03/18 | `__tests__/`, `__mocks__/`, `coverage/` を削除 |
| 2025/03/18 | `worker/` を削除 |
| 2025/03/18 | **pre-push フックを追加**（push 時にカバレッジの警告を表示） |


---

## **📌 今後の対応**
- **バッチ処理の移行**  
  現在 `gas/` にあるバッチ処理 (`