-- メッセージテーブルの作成
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期データの挿入
INSERT INTO messages (message) VALUES ('こんにちは！');
INSERT INTO messages (message) VALUES ('元気ですか？');
INSERT INTO messages (message) VALUES ('何かお手伝いできることはありますか？');
INSERT INTO messages (message) VALUES ('素敵な一日をお過ごしください');
INSERT INTO messages (message) VALUES ('うさこだよ！'); 