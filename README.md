# Atelier Console — Clothes Shop Management

A self-hosted admin + staff console for running a clothes shop: products with
photos, prices and discounts, a team of workers with roles, and a
request/approval workflow so staff can propose changes an admin signs off on.

This is a **real Node.js backend** (not a Claude-artifact demo) — data is
saved to plain JSON files on disk, passwords are hashed, and logins use JWTs.
It's meant to be simple enough to run on a laptop or a small VPS with zero
external services required.

## What's included

- `server.js` — Express app, serves the API and the frontend
- `routes/` — `auth`, `products`, `workers`, `requests`, `upload`
- `middleware/auth.js` — JWT verification + admin-only guard
- `db.js` — tiny JSON-file datastore (`data/workers.json`, `data/products.json`, `data/requests.json`), created automatically on first run
- `public/index.html` — the whole frontend (single file, no build step)
- `uploads/` — product photos land here, served at `/uploads/<file>`

## Run it locally

Requires Node.js 18+.

```bash
npm install
cp .env.example .env       # then edit JWT_SECRET in .env
npm start
```

Open **http://localhost:3000**.

First login: **username `admin`, password `admin123`** (this is created
automatically the first time the server runs — the console prints it to the
log too). Sign in, then immediately go to the **Team** tab and either change
your own password by removing and re-adding the admin account with a new one,
or add your real team members.

## How the roles work

- **Admin**: add/edit/delete products directly, add or remove team members,
  and approve or reject requests from staff.
- **Staff**: browse the shop floor, submit a **new product** (goes out as a
  pending request), or **request removal** of an existing product. Nothing a
  staff member does goes live until an admin approves it, from the Requests
  tab.

## Deploying it for real

To make this reachable from anywhere (not just your own machine), you need
somewhere to run a persistent Node process. A few straightforward options:

- **A small VPS** (e.g. DigitalOcean, Hetzner, a cheap Linux box): install
  Node, copy this folder over, run `npm install && npm start` behind a
  process manager like `pm2`, and put Nginx or Caddy in front for HTTPS.
- **Render / Railway / Fly.io**: point them at this folder (or a Git repo
  containing it), set the `JWT_SECRET` environment variable in their
  dashboard, and they'll run `npm start` for you with a public URL and free
  HTTPS.

Either way:

1. **Set a real `JWT_SECRET`** — don't leave the default in `.env.example`.
2. **Change the default admin password** immediately after first login.
3. **Back up the `data/` folder** occasionally — it's the entire database.
   If you outgrow plain JSON files (many products, many staff, need to run
   more than one server instance), swap `db.js` for a real database like
   PostgreSQL or SQLite — the rest of the app (routes, frontend) doesn't need
   to change, only `db.js`.
4. **Use HTTPS** in production (via your host or a reverse proxy) — login
   currently sends passwords over plain HTTP if you don't.

## Notes & limits

- Photos are stored as files under `uploads/`, capped at 5MB each.
- Discounts are capped at 90%.
- This is a small-shop-scale tool: the JSON-file storage is simple and easy
  to inspect/back up, but isn't built for high concurrency or huge catalogs.
