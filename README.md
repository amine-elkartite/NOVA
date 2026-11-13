# NOVA

React storefront and Express API backed by MySQL.

## Local setup

1. Start MySQL (for example, in XAMPP).
2. Copy `server/.env.example` to `server/.env`. Configure the database connection and set `JWT_SECRET` to a random secret. Keep this file private.
3. Install the dependencies in `server/` and `client/` using their lockfiles.
4. From `server/`, run `node scripts/setup-db.js`. This creates the configured database and missing tables without deleting existing data.
5. From `server/`, run `npm run dev`.
6. From `client/`, run `npm run dev` and open `http://localhost:5173`.

The API defaults to `http://localhost:5000/api`. Set `VITE_API_URL` in `client/.env` if needed. `GET /api/health` checks database connectivity.

A fresh database contains no products or users. Register through the app; manage catalogue data through an authorized administrator account. Configure email and a payment provider before using those integrations.

## Verification

From `server/`: `node --test tests/*.test.js`.

From `client/`: `npm run lint` and `npm run build`.

The schema and migration files in `database/` are application resources. Keep them, along with `server/uploads/` and both dependency directories. Temporary `.tmp-chrome-profile-*` browser testing folders are disposable and ignored.
