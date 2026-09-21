# Arohi by Megha — MERN E-Commerce Platform

A premium fashion-jewellery storefront with a secure admin dashboard, built as three apps sharing one API:

- `server/` — Express + MongoDB API (also serves the built `client` and `admin` apps in production, so there is only one thing to deploy)
- `client/` — customer storefront (React + Vite + Tailwind)
- `admin/` — admin dashboard (separate React + Vite app, separate login/2FA, mounted at `/admin` in production)

## 1. One-time setup

```bash
npm run install:all        # installs server, client and admin dependencies
cp server/.env.example server/.env
```

Then edit `server/.env`:

1. **MongoDB Atlas** (required to run anything) — create a free M0 cluster at https://cloud.mongodb.com, add a database user, allow network access from your IP (or `0.0.0.0/0` for simplicity during development), and paste the connection string into `MONGODB_URI`.
2. **Auth secrets** — generate four random strings (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`, run it 4 times) and paste them into `CUSTOMER_ACCESS_SECRET`, `CUSTOMER_REFRESH_SECRET`, `ADMIN_ACCESS_SECRET`, `ADMIN_REFRESH_SECRET`.
3. **Cloudinary** (optional to start, required for the admin dashboard's image/video uploads) — free account at https://cloudinary.com, copy Cloud Name / API Key / API Secret from the dashboard.
4. **Razorpay** (optional to start, required for online payment — COD works without it) — https://razorpay.com, use test-mode keys until you're ready to go live.
5. `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the very first admin account, created by the seed script below.

## 2. Seed the database

```bash
npm run seed
```

Creates the 5 categories, 15 starter products (with placeholder photography shipped in `client/public/products/`), the first admin account, and default homepage content.

## 3. Run it

```bash
npm run dev
```

Starts all three apps together:
- API: http://localhost:5000
- Storefront: http://localhost:5173
- Admin: http://localhost:5174 — log in with the `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` from your `.env`. First login walks you through scanning a QR code in Google Authenticator/Authy to enable two-factor auth — this is required, there is no way to skip it.

## 4. Production build (single host)

```bash
npm run build     # builds client/dist and admin/dist
npm start         # runs the API, which now also serves both built apps
```

In production, everything is served by the one Node process on `PORT` (default 5000): the storefront at `/`, the admin dashboard at `/admin`, and the API under `/api`. Set `NODE_ENV=production` for this static-serving behavior to activate. This means you only need **one** hosting service (e.g. Render/Railway free tier) — not a separate frontend and backend host.

## 5. Deploying to Vercel

Vercel doesn't run a long-lived Node process the way Render/Railway do — it runs the API as serverless functions and has a read-only filesystem outside `/tmp`. This repo is set up for that too, via the same one-deploy idea:

- `api/index.js` wraps the Express app (`server/src/app.js`) as a single serverless function handling everything under `/api/*`, with a cached MongoDB connection so warm invocations don't reconnect every request.
- `vercel.json` routes `/api/*` to that function, `/admin/*` to the built admin SPA, and everything else to the built client SPA.
- `npm run vercel-build` (auto-detected by Vercel) builds both React apps and merges their `dist/` output into a single `public/` folder, which is what Vercel serves as static files.

To deploy: import this GitHub repo in the Vercel dashboard, leave the framework preset on "Other" (it'll pick up `vercel.json`), and add every variable from `server/.env` (Mongo/Cloudinary/Razorpay/auth secrets/seed admin) under **Project Settings → Environment Variables** — Vercel injects these directly into `process.env`, there's no `.env` file involved in production. No other config needed.

One behavioral difference from Render/Railway: the Excel order export always regenerates fresh from MongoDB on every download (`buildOrdersWorkbook()` in `server/src/utils/orderExcelLog.js`) rather than maintaining a live-appended file on disk — this is actually the safer design everywhere, not just a Vercel workaround, since Mongo is the real source of truth either way.

## What's deferred

Per the phased approach agreed for this project, the following are intentionally not built yet because they depend on third-party vendor accounts you haven't set up:

- AI shopping chatbot
- AR/virtual try-on for earrings/necklaces/rings
- WhatsApp/SMS/CRM marketing automation
- Google Analytics 4 / Meta Pixel / Search Console
- Gift cards
- Razorpay **live** keys (test mode works today)

Wiring any of these in later is a config/integration change, not a rewrite.
