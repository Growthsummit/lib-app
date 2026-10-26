# Community Library Management System

The React app in `frontend/` uses the Express API in `backend/`. React Router
uses hash-based routes so the pages also work when deployed to GitHub Pages.
Books, users, stock changes, transaction history, and login accounts are stored
in MySQL. The existing page layout and styles are unchanged.

## Requirements

- Node.js 20.19+ (or 22.12+)
- MySQL 8+

## Set up MySQL and the API

1. Create a MySQL user with permission to create/use the `library_management`
   database, or configure an existing database in the backend environment.
2. Initialize the database and tables:

   ```powershell
   Get-Content backend\schema.sql | mysql -u root -p
   ```

3. Copy `backend\.env.example` to `backend\.env`, then set `DB_USER`,
   `DB_PASSWORD`, and a unique `JWT_SECRET` of at least 32 characters. Change
   `ADMIN_PASSWORD` before using the app outside local development.
4. Install backend dependencies and start the API:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

The API listens on `http://localhost:3001`; `CLIENT_ORIGIN` controls which
frontend origin may call it. On startup, the API creates an administrator
account if `ADMIN_USERNAME` does not already exist. The example credentials
are `admin` / `admin123`; change them in `backend\.env` before first startup.

## Start the React app

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:3001/api`. To use another API
address, create a root `.env` containing `VITE_API_URL=http://localhost:3001/api`.

New self-service registrations receive regular user access; an administrator
can create and manage library member records from User Management. Administrator
access is not granted by public registration. Registered usernames are stored
in MySQL and may contain letters and spaces only; passwords are stored as
bcrypt hashes and can be used to sign in after registration.
Self-registered accounts are also listed in the admin's Registered Users table;
their usernames and account roles are shown. Admins can delete registered
accounts from this table; deleted users can no longer sign in.

## API

- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- `GET|POST /api/books`, `PUT|DELETE /api/books/:id`
- `GET|POST /api/transactions`, `DELETE /api/transactions`
- `GET|POST /api/users`, `PUT|DELETE /api/users/:id`

All routes other than login and registration require a bearer token. Book and
user management and clearing transaction history require administrator access.
Borrowing, returns, and stock changes are recorded transactionally so concurrent
borrowing requests cannot overdraw the available quantity.
Administrators can view the full transaction history. Regular users can view
only their own borrowing and return history and cannot clear transaction history.
The admin's Registered Users table is loaded from MySQL and includes only
self-registered user accounts with stored credentials. Fresh database setups
do not insert example users; existing database rows are kept.
