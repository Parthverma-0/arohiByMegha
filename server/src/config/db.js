import mongoose from 'mongoose';

// Cached across invocations on serverless platforms (Vercel): a cold start pays
// the connection cost once, and every warm invocation in the same container
// reuses the existing connection instead of opening a new one per request.
let connectPromise = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[db] MONGODB_URI is not set — API will start but every DB-backed route will fail until you add it to server/.env');
    return;
  }
  if (mongoose.connection.readyState === 1) return; // already connected
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(uri)
      .then(() => console.log('[db] Connected to MongoDB'))
      .catch((err) => {
        connectPromise = null; // allow a retry on the next call instead of staying stuck on a failed attempt
        console.error('[db] Failed to connect to MongoDB:', err.message);
      });
  }
  await connectPromise;
}
