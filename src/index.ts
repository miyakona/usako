import { startServer } from "./server";
import { DEFAULT_PORT } from "./constants";

/**
 * アプリケーションのエントリーポイント
 * サーバーを非同期で起動する
 */
async function main() {
  try {
    await startServer(DEFAULT_PORT);
    console.log(`サーバーが起動しました: http://localhost:${DEFAULT_PORT}`);
  } catch (error) {
    console.error("サーバー起動エラー:", error);
    process.exit(1);
  }
}

// 非同期関数の実行
main();
