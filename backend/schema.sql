CREATE DATABASE IF NOT EXISTS library_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE library_management;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  member_id VARCHAR(50) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'Member',
  username VARCHAR(100) NULL,
  password_hash VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_member_id (member_id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150) NOT NULL,
  genre VARCHAR(100) NOT NULL DEFAULT '',
  isbn VARCHAR(20) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_books_isbn (isbn)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  book_id BIGINT UNSIGNED NULL,
  book_title VARCHAR(255) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  user_name VARCHAR(150) NOT NULL,
  action VARCHAR(20) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  stock_after INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_created_at (created_at),
  CONSTRAINT fk_transactions_book FOREIGN KEY (book_id)
    REFERENCES books (id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO books (title, author, genre, isbn, quantity) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', 'Classic', '9780743273565', 5),
  ('To Kill a Mockingbird', 'Harper Lee', 'Fiction', '9780061120084', 1);
