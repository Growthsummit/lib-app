import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to connect to the Turso database.');
}

const client = createClient({
  url: databaseUrl,
  authToken
});

function isReadQuery(sql) {
  return /^\s*(SELECT|PRAGMA|EXPLAIN)\b/i.test(sql);
}

function normalizeResult(result, sql) {
  if (isReadQuery(sql)) return [result.rows];
  return [{
    insertId: Number(result.lastInsertRowid || 0),
    affectedRows: result.rowsAffected
  }];
}

async function executeOn(connection, sql, args = []) {
  const result = await connection.execute({ sql, args });
  return normalizeResult(result, sql);
}

export function isUniqueConstraintError(error) {
  return error?.code === 'SQLITE_CONSTRAINT_UNIQUE'
    || (error?.code?.startsWith('SQLITE_CONSTRAINT') && /UNIQUE constraint failed/i.test(error.message));
}

export const pool = {
  execute: (sql, args) => executeOn(client, sql, args),
  async getConnection() {
    let transaction;
    return {
      async beginTransaction() {
        transaction = await client.transaction('write');
      },
      execute(sql, args) {
        if (!transaction) throw new Error('Database transaction has not been started.');
        return executeOn(transaction, sql, args);
      },
      async commit() {
        if (!transaction) throw new Error('Database transaction has not been started.');
        await transaction.commit();
        transaction = undefined;
      },
      async rollback() {
        if (!transaction) return;
        await transaction.rollback();
        transaction = undefined;
      },
      release() {}
    };
  }
};

export async function initializeDatabase() {
  const schemaPath = fileURLToPath(new URL('../schema.sql', import.meta.url));
  const schema = await readFile(schemaPath, 'utf8');
  const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean);

  for (const sql of statements) {
    await client.execute(sql);
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
