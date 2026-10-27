# Community Library Management System

The React app in `frontend/` uses the Express API in `backend/`. React Router
uses hash-based routes so the pages also work when deployed to GitHub Pages.
Books, users, stock changes, transaction history, and login accounts are stored
in Turso (libSQL). The existing page layout and styles are unchanged.

## Requirements

- Node.js 20.19+ (or 22.12+)
- A Turso database for production

## Set up Turso and the API

1. Create a database in [Turso](https://turso.tech/) and get its database URL
   and authentication token.
2. Copy `backend\.env.example` to `backend\.env` and set
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and a unique `JWT_SECRET` of at
   least 32 characters. Change `ADMIN_PASSWORD` before using the app outside
   local development. The API creates its tables and initial book records at
   startup. Both Turso values are required in local development and production;
   the app does not use a local database fallback.
3. Install backend dependencies and start the API:

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

During local development, Vite proxies `/api` to `http://localhost:3001`. To
point the frontend at another API, copy `frontend/.env.example` to
`frontend/.env` and set `VITE_API_URL`.

New self-service registrations receive regular user access; an administrator
can create and manage library member records from User Management. Administrator
access is not granted by public registration. Registered usernames are stored
in Turso and may contain letters and spaces only; passwords are stored as
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
The admin's Registered Users table is loaded from Turso and includes only
self-registered user accounts with stored credentials. Fresh database setups
do not insert example users; existing database rows are kept.

## Deploy

The React app is built for **Vercel**. The Express API runs on
**Render**. The GitHub repository is `https://github.com/Growthsummit/lib-app.git`.

### 1. Deploy the API on Render

1. Push this repository to GitHub (`library-app` is the git root).
2. In [Render](https://dashboard.render.com), choose **New > Blueprint** and
   select this repository. Render reads `render.yaml`.
3. The blueprint creates `library-api` (Node web service, root directory
   `backend`). Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from your Turso
   database on the service when prompted by Render.
   If you already created `library-api` as a manual web service, syncing the
   Blueprint is required for Render to apply its service settings. Otherwise,
   configure that service with root directory `backend`, build command
   `npm install && npm run build`, start command `npm start`, and set
   `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Do not use `npm run dev` as the
   production start command.
4. Set `CLIENT_ORIGIN` on `library-api` to the Vercel URL with no trailing
   slash, for example `https://your-app.vercel.app`. You can add this after
   Vercel gives you a domain; until then CORS will reject the frontend.
5. After the first deploy, open the `library-api` environment tab and copy:
   - the public service URL (used as `VITE_API_URL` on Vercel)
   - `ADMIN_PASSWORD` (generated; this is the admin sign-in password)
6. Confirm `https://your-api.onrender.com/api/health` returns `{ "ok": true }`.
   The first request after idle time on the free plan can take about a minute.

If you are switching an existing deployment from MySQL, its existing data is
not copied automatically. Export and migrate the records separately before
switching the API to Turso.

### 2. Deploy the frontend on Vercel

1. In [Vercel](https://vercel.com), import the same GitHub repository.
2. Set the **Root Directory** to `frontend`. Vercel must install and build
   from that folder (`frontend/package.json`), not from the repository root.
   If Root Directory is `frontend` and the install command is still
   `npm --prefix frontend install`, the build looks for
   `frontend/frontend/package.json` and fails. Use `npm install`,
   `npm run build`, and output directory `dist`.
3. The repository's `frontend/.env.production` configures the current Render
   API URL by default. If your Render service URL changes, update that file or
   set this Vercel environment variable to override it **before building**:
   - Name: `VITE_API_URL`
   - Value: `https://your-api.onrender.com/api` (your Render URL, including `/api`)
4. Deploy. After Vercel assigns a domain, set `CLIENT_ORIGIN` on Render to
   `https://your-app.vercel.app` and redeploy the API (or restart the service)
   so the browser is allowed to call it.
5. Rebuild the Vercel project if you change `VITE_API_URL`; Vite bakes that
   value in at build time.

`ALLOW_VERCEL_PREVIEWS=true` on Render lets `*.vercel.app` preview URLs call
the API. Turn it off if you only want the production origin.
