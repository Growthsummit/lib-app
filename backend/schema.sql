PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  member_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Member',
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  isbn TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity BETWEEN 0 AND 4294967295),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER,
  book_title TEXT NOT NULL,
  user_id INTEGER,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 0 AND 4294967295),
  stock_after INTEGER NOT NULL CHECK (stock_after BETWEEN 0 AND 4294967295),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions (created_at);

INSERT OR IGNORE INTO books (title, author, genre, isbn, quantity) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', 'Classic', '9780743273565', 5),
  ('To Kill a Mockingbird', 'Harper Lee', 'Fiction', '9780061120084', 1);
