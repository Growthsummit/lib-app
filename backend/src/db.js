import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || (
    process.env.NODE_ENV === 'production' ? 'library-mysql' : 'localhost'
  ),
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined
};

export const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

export async function initializeDatabase() {
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  let schema = await readFile(schemaPath, 'utf8');
  const dbName = process.env.DB_NAME || 'library_management';

  // Remove hardcoded CREATE DATABASE and USE statements from schema
  // and handle it dynamically based on .env
  schema = schema.replace(/CREATE DATABASE IF NOT EXISTS `?\w+`?[^;]*;/i, '');
  schema = schema.replace(/USE `?\w+`?;/i, '');

  const connection = await mysql.createConnection({
    ...dbConfig,
    multipleStatements: true
  });
  try {
    try {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } catch (error) {
      // Hosted MySQL users often cannot create databases; the service DB already exists.
      console.warn(`Skipping CREATE DATABASE (${error.message})`);
    }
    await connection.query(`USE \`${dbName}\``);
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
