# LINE Bot - Cloudflare Worker + D1 Migration

## プロジェクト概要
Google Apps Scriptで動作していたLINE Botを、Cloudflare Worker + D1に移行したプロジェクトです。

## 環境設定

### 前提条件
- Node.js
- Wrangler CLI
- Cloudflare アカウント

### セットアップ手順

1. プロジェクトをクローン
```bash
git clone [your-repo-url]
cd [project-directory]
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数の設定
- `wrangler.example.toml` を `wrangler.toml` にコピー
```bash
cp wrangler.example.toml wrangler.toml
```

- `.env` ファイルを作成
```bash
cp .env.example .env
```

4. Cloudflare Secrets の設定
```bash
# LINE Channel Secret
wrangler secret put LINE_CHANNEL_SECRET

# LINE Channel Access Token
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN

# データベース接続文字列
wrangler secret put DATABASE_URL
```

5. ローカル開発サーバーの起動
```bash
npm run dev
```

### 注意
- `.env` と `wrangler.toml` は Git管理対象外です
- 機密情報は必ず安全に管理してください

## 主な機能
- LINE Webhook処理
- D1データベース連携
- メッセージ・ポストバックイベント処理

## 技術スタック
- Cloudflare Workers
- TypeScript
- D1 Database
- LINE Messaging API

## ライセンス
MIT License 