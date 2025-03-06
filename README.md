# usako

[![Coverage](https://img.shields.io/badge/coverage-71.25%25-brightgreen)](https://github.com/miyakona/usako/actions/workflows/test.yml)

家計簿管理のためのLINEボットアプリケーション

## 機能

- 生活費の報告
- 報告済の支出の確認
- 支払額の中間報告
- 家事の管理と通知

## 開発

### 必要条件

- Node.js
- npm
- Google Apps Script

### セットアップ

```bash
# 依存関係のインストール
npm install

# テストの実行
npm test

# カバレッジレポートの生成
npm run test:coverage
```

### テスト

```bash
# テストの実行
npm test

# テストの監視モード
npm run test:watch
```

### リント

```bash
# リントの実行
npm run lint

# リントの自動修正
npm run lint:fix
```
