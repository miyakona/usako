# Usako

LINE Messaging APIを利用したボットアプリケーション

## デプロイ方法

以下のコマンドでデプロイします：

```bash
npm run deploy
```

このコマンドは以下の2つのステップを実行します：
1. `wrangler deploy` - アプリケーションコードをCloudflare Workersにデプロイ
2. `wrangler d1 migrations apply usako-messages --remote` - D1データベースにマイグレーションを適用

## データベースマイグレーション

このアプリケーションはCloudflare D1データベースを使用しています。マイグレーションファイルは `migrations/` ディレクトリに保存されています。

マイグレーションを手動で適用する場合は以下のコマンドを実行します：

```bash
# リモート（本番）環境へのマイグレーション適用
npx wrangler d1 migrations apply usako-messages --remote

# ローカル開発環境へのマイグレーション適用
npx wrangler d1 migrations apply usako-messages
```

## テスト実行方法

すべてのテストを実行：

```bash
npm run test:all
```

単体テストのみ実行：

```bash
npm run test:unit
```

E2Eテストのみ実行：

```bash
npm run e2e
```

テスト結果はコンソールに表示されます。

```bash
# 依存パッケージのインストール
npm install

# Playwrightのブラウザをインストール
npx playwright install
```
