# Usako Worker

LINE BotとGoogle Sheetsを連携させるCloudflare Workersアプリケーション

## 機能

- LINEメッセージの受信と応答
- Google Sheetsとの連携
- 家事管理機能
- 家計簿機能

## 必要条件

- Node.js 18以上
- npm 9以上
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [LINE Messaging API](https://developers.line.biz/ja/services/messaging-api/)アカウント
- [Google Cloud Platform](https://console.cloud.google.com/)アカウント

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
- `.dev.vars`ファイルを作成し、以下の変数を設定:
```
SPREADSHEET_ID=your-spreadsheet-id
```

3. シークレットの設定:
```bash
wrangler secret put LINE_CHANNEL_SECRET
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
```

4. 開発サーバーの起動:
```bash
npm run dev
```

5. デプロイ:
```bash
npm run deploy
```

## 開発

- `src/`: ソースコード
  - `index.ts`: エントリーポイント
  - `types/`: 型定義
  - `services/`: サービス層
  - `handlers/`: イベントハンドラー

## ライセンス

ISC 