# Usako

LINE Messaging APIを利用したボットアプリケーション

## 環境設定

このアプリケーションを実行するには、以下の環境変数を設定する必要があります：

```bash
# .env または .dev.vars ファイルを作成し、以下の変数を設定
DATABASE_ID=your_cloudflare_d1_database_id
```

開発用に `wrangler.dev.jsonc` ファイルを作成することもできます：

```bash
# wrangler.example.jsonc をコピーして wrangler.dev.jsonc を作成
cp wrangler.example.jsonc wrangler.dev.jsonc
# エディタで開いて実際の値を設定
```

本番環境では、Cloudflare Dashboard または Wrangler CLI でシークレットを設定します：

```bash
# Cloudflare Workers のシークレットを設定
npx wrangler secret put DATABASE_ID
```

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
