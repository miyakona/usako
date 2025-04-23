import { startServer } from "./server";
import { DEFAULT_PORT } from "./constants";
import { info, error } from "./utils/logger";

/**
 * アプリケーションのエントリーポイント
 * サーバーを非同期で起動する
 */
async function main() {
  try {
    await startServer(DEFAULT_PORT);
    info(`サーバーが起動しました: http://localhost:${DEFAULT_PORT}`);
  } catch (err) {
    error("サーバー起動エラー:", err);
    process.exit(1);
  }
}

// 非同期関数の実行
main();
