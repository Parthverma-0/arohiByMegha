// Vercel serverless entry point. Vercel invokes this on every request to
// /api/* (see the rewrite in vercel.json) instead of running server/src/server.js's
// long-lived app.listen() — there is no persistent process here, so the DB
// connection has to be (re)established per invocation. connectDB() caches
// the connection across warm invocations of the same container, so this is
// cheap except on a true cold start.
// No dotenv import here — Vercel injects environment variables directly into
// process.env (set them in the project's dashboard, not via a .env file).
import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

const app = createApp();

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
