import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

export const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initializeDatabase() {
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  const schema = await readFile(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    ...dbConfig,
    multipleStatements: true
  });
  try {
    await connection.query(schema);
  } finally {
    await connection.end();
  }
}

export async function ensureAdminAccount() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  if (existing.length) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.execute(
    `INSERT INTO users (name, member_id, role, username, password_hash)
     VALUES (?, ?, 'admin', ?, ?)`,
    ['Library Administrator', 'ADMIN-001', username, passwordHash]
  );
}
