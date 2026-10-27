import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { pool, ensureAdminAccount, initializeDatabase } from './db.js';
import { asyncRoute, authenticate, requireAdmin } from './middleware.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
}

const app = express();
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);
// Accept any localhost origin so the Vite dev server can fall back to another
// port (for example 5174 when 5173 is already taken) without the API rejecting
// the request.
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || localOriginPattern.test(origin)) {
      return callback(null, true);
    }
    const error = new Error(`Origin ${origin} is not allowed to use the library API.`);
    error.status = 403;
    return callback(error);
  }
}));
app.use(express.json({ limit: '100kb' }));

const api = express.Router();
app.use('/api', api);

api.get('/health', (_req, res) => {
  return res.json({ ok: true });
});

function mapBook(book) {
  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    genre: book.genre,
    isbn: book.isbn,
    quantity: Number(book.quantity)
  };
}

function mapUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    memberId: user.member_id,
    role: user.role,
    username: user.username
  };
}

function requireText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    const error = new Error(`${label} is required and must be at most ${maxLength} characters.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function requireUsername(value) {
  const username = requireText(value, 'Username', 100);
  if (username.length < 3 || !/^[\p{L} ]+$/u.test(value)) {
    const error = new Error('Username must be at least 3 characters and contain only letters and spaces.');
    error.status = 400;
    throw error;
  }
  return username;
}

function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 200) {
    const error = new Error('Password is required and must be at most 200 characters.');
    error.status = 400;
    throw error;
  }
  return value;
}

function requireQuantity(value, label = 'Quantity') {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4294967295) {
    const error = new Error(`${label} must be a positive whole number no greater than 4294967295.`);
    error.status = 400;
    throw error;
  }
  return quantity;
}

function handleDatabaseError(error, res, next) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'That ISBN, username, or membership ID is already in use.' });
  }
  return next(error);
}

api.post('/auth/login', asyncRoute(async (req, res) => {
  const username = requireUsername(req.body.username);
  const password = requirePassword(req.body.password);
  const [rows] = await pool.execute(
    `SELECT id, name, member_id, role, username, password_hash
     FROM users WHERE username = ?`,
    [username]
  );
  const user = rows[0];
  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const publicUser = {
    id: String(user.id),
    name: user.name,
    memberId: user.member_id,
    username: user.username,
    role: user.role
  };
  const token = jwt.sign(
    { id: publicUser.id, username: publicUser.username, role: publicUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return res.json({ token, user: publicUser });
}));

api.post('/auth/register', asyncRoute(async (req, res) => {
  const username = requireUsername(req.body.username);
  const password = requirePassword(req.body.password);
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const memberId = `REG-${randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    await pool.execute(
      `INSERT INTO users (name, member_id, role, username, password_hash)
       VALUES (?, ?, 'user', ?, ?)`,
      [username, memberId, username, passwordHash]
    );
    return res.status(201).json({ message: 'Account created successfully! You can now login.' });
  } catch (error) {
    return handleDatabaseError(error, res, (problem) => { throw problem; });
  }
}));

api.get('/auth/me', authenticate, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, member_id, role, username FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(401).json({ error: 'This account no longer exists.' });
  return res.json({
    id: String(rows[0].id),
    name: rows[0].name,
    memberId: rows[0].member_id,
    username: rows[0].username,
    role: rows[0].role
  });
}));

api.get('/books', authenticate, asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, title, author, genre, isbn, quantity FROM books ORDER BY title'
  );
  return res.json(rows.map(mapBook));
}));

api.post('/books', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const title = requireText(req.body.title, 'Title', 255);
  const author = requireText(req.body.author, 'Author', 150);
  const genre = typeof req.body.genre === 'string' ? req.body.genre.trim().slice(0, 100) : '';
  const isbn = requireText(req.body.isbn, 'ISBN', 20);
  const quantity = requireQuantity(req.body.quantity);
  try {
    const [result] = await pool.execute(
      'INSERT INTO books (title, author, genre, isbn, quantity) VALUES (?, ?, ?, ?, ?)',
      [title, author, genre, isbn, quantity]
    );
    await pool.execute(
      `INSERT INTO transactions
       (book_id, book_title, user_id, user_name, action, quantity, stock_after)
       VALUES (?, ?, ?, ?, 'stock_add', ?, ?)`,
      [result.insertId, title, req.user.id, req.user.username, quantity, quantity]
    );
    const [rows] = await pool.execute(
      'SELECT id, title, author, genre, isbn, quantity FROM books WHERE id = ?',
      [result.insertId]
    );
    return res.status(201).json(mapBook(rows[0]));
  } catch (error) {
    return handleDatabaseError(error, res, (problem) => { throw problem; });
  }
}));

api.put('/books/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const title = requireText(req.body.title, 'Title', 255);
  const author = requireText(req.body.author, 'Author', 150);
  const genre = typeof req.body.genre === 'string' ? req.body.genre.trim().slice(0, 100) : '';
  const isbn = requireText(req.body.isbn, 'ISBN', 20);
  const quantity = requireQuantity(req.body.quantity);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      'SELECT id, title, quantity FROM books WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Book not found.' });
    }
    const previousQuantity = Number(existing[0].quantity);
    await connection.execute(
      `UPDATE books SET title = ?, author = ?, genre = ?, isbn = ?, quantity = ?
       WHERE id = ?`,
      [title, author, genre, isbn, quantity, req.params.id]
    );
    if (quantity !== previousQuantity) {
      await connection.execute(
        `INSERT INTO transactions
         (book_id, book_title, user_id, user_name, action, quantity, stock_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.params.id,
          title,
          req.user.id,
          req.user.username,
          quantity > previousQuantity ? 'stock_add' : 'stock_deduct',
          Math.abs(quantity - previousQuantity),
          quantity
        ]
      );
    }
    const [rows] = await connection.execute(
      'SELECT id, title, author, genre, isbn, quantity FROM books WHERE id = ?',
      [req.params.id]
    );
    await connection.commit();
    return res.json(mapBook(rows[0]));
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That ISBN is already in use.' });
    }
    throw error;
  } finally {
    connection.release();
  }
}));

api.delete('/books/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM books WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Book not found.' });
  return res.status(204).end();
}));

api.get('/users', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, name, member_id, role, username
     FROM users
     WHERE role <> 'admin'
     ORDER BY name`
  );
  return res.json(rows.map(mapUser));
}));

api.post('/users', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const name = requireText(req.body.name, 'Name', 150);
  const memberId = requireText(req.body.memberId, 'Membership ID', 50);
  const role = requireText(req.body.role, 'Role', 30);
  if (!['Librarian', 'Member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Librarian or Member.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, member_id, role) VALUES (?, ?, ?)',
      [name, memberId, role]
    );
    return res.status(201).json({
      id: String(result.insertId), name, memberId, role
    });
  } catch (error) {
    return handleDatabaseError(error, res, (problem) => { throw problem; });
  }
}));

api.put('/users/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const name = requireText(req.body.name, 'Name', 150);
  const memberId = requireText(req.body.memberId, 'Membership ID', 50);
  const role = requireText(req.body.role, 'Role', 30);
  if (!['Librarian', 'Member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Librarian or Member.' });
  }
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role <> "admin"',
      [req.params.id]
    );
    if (!existing.length) return res.status(404).json({ error: 'User not found.' });
    await pool.execute(
      `UPDATE users SET name = ?, member_id = ?, role = ?
       WHERE id = ? AND role <> "admin"`,
      [name, memberId, role, req.params.id]
    );
    return res.json({ id: String(req.params.id), name, memberId, role });
  } catch (error) {
    return handleDatabaseError(error, res, (problem) => { throw problem; });
  }
}));

api.delete('/users/:id', authenticate, requireAdmin, asyncRoute(async (req, res) => {
  const [result] = await pool.execute(
    `DELETE FROM users
     WHERE id = ?
       AND role <> 'admin'
       AND (
         username IS NULL
         OR (role = 'user' AND password_hash IS NOT NULL)
       )`,
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
  return res.status(204).end();
}));

api.get('/transactions', authenticate, asyncRoute(async (req, res) => {
  const [rows] = req.user.role === 'admin'
    ? await pool.execute(
      `SELECT id, book_title, user_name, action, quantity, stock_after, created_at
       FROM transactions
       ORDER BY created_at ASC, id ASC`
    )
    : await pool.execute(
      `SELECT id, book_title, user_name, action, quantity, stock_after, created_at
       FROM transactions
       WHERE user_id = ? AND action IN ('borrow', 'return')
       ORDER BY created_at ASC, id ASC`,
      [req.user.id]
    );
  const transactions = rows.map((item) => {
    const description = {
      stock_add: `Added ${item.quantity} stock to "${item.book_title}" (now ${item.stock_after})`,
      stock_deduct: `Deducted ${item.quantity} from "${item.book_title}" (now ${item.stock_after})`,
      borrow: `${item.user_name} borrowed ${item.quantity} of "${item.book_title}" (now ${item.stock_after})`,
      return: `${item.user_name} returned ${item.quantity} of "${item.book_title}" (now ${item.stock_after})`
    }[item.action];
    return {
      id: String(item.id),
      message: `[${new Date(item.created_at).toLocaleString()}] ${description}`
    };
  });
  return res.json(transactions);
}));

api.post('/transactions', authenticate, asyncRoute(async (req, res) => {
  const bookId = requireText(String(req.body.bookId || ''), 'Book', 30);
  const quantity = requireQuantity(req.body.quantity);
  if (!['add', 'deduct'].includes(req.body.action)) {
    return res.status(400).json({ error: 'Action must be add or deduct.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [books] = await connection.execute(
      'SELECT id, title, author, genre, isbn, quantity FROM books WHERE id = ? FOR UPDATE',
      [bookId]
    );
    if (!books.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Book not found.' });
    }
    const book = books[0];
    const adding = req.body.action === 'add';
    const quantityBefore = Number(book.quantity);
    if (!adding && quantityBefore < quantity) {
      await connection.rollback();
      return res.status(409).json({ error: `Not enough stock. Only ${quantityBefore} available.` });
    }

    const quantityAfter = adding ? quantityBefore + quantity : quantityBefore - quantity;
    if (quantityAfter > 4294967295) {
      await connection.rollback();
      return res.status(400).json({ error: 'The resulting stock quantity is too large.' });
    }
    const action = adding
      ? (req.user.role === 'admin' ? 'stock_add' : 'return')
      : (req.user.role === 'admin' ? 'stock_deduct' : 'borrow');
    await connection.execute('UPDATE books SET quantity = ? WHERE id = ?', [quantityAfter, bookId]);
    await connection.execute(
      `INSERT INTO transactions
       (book_id, book_title, user_id, user_name, action, quantity, stock_after)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookId, book.title, req.user.id, req.user.username, action, quantity, quantityAfter]
    );
    await connection.commit();
    return res.json({
      book: mapBook({ ...book, quantity: quantityAfter })
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

api.delete('/transactions', authenticate, requireAdmin, asyncRoute(async (_req, res) => {
  await pool.execute('DELETE FROM transactions');
  return res.status(204).end();
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || 500;
  return res.status(status).json({
    error: status === 500 ? 'An unexpected server error occurred.' : error.message
  });
});

const port = Number(process.env.PORT || 3001);
try {
  await initializeDatabase();
  await ensureAdminAccount();
  app.listen(port, () => {
    console.log(`Library API listening on port ${port}`);
  });
} catch (error) {
  console.error('Could not start the API. Check that MySQL is running and the database credentials in backend/.env are correct.', error);
  process.exitCode = 1;
}
