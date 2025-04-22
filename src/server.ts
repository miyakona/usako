import express, { Request, Response } from "express";

const app = express();
const port = process.env.PORT || 8787;

// ルートエンドポイントの定義
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Hello World!");
});

// サーバー起動関数をエクスポート
export function startServer() {
  return app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
  });
}

// スクリプトとして直接実行された場合は起動
if (require.main === module) {
  startServer();
}

export default app;
