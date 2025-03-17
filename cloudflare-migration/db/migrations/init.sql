-- 家計簿テーブル
CREATE TABLE variable_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  category TEXT,
  amount REAL,
  description TEXT,
  user_id TEXT
);

-- 家事管理テーブル
CREATE TABLE housework (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  task TEXT,
  status TEXT DEFAULT 'pending',
  due_date TEXT,
  assignee TEXT
);

-- 買い物リストテーブル
CREATE TABLE purchase_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  user_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
); 