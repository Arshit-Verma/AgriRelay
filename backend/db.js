import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Add your Postgres connection string to backend/.env, then run "npm run db:setup" in backend/.');
  process.exit(1);
}

const isLocalDatabase = ['localhost', '127.0.0.1'].includes(new URL(connectionString).hostname);

export const pool = new pg.Pool({
  connectionString,
  // Hosted databases such as Supabase require SSL but present a certificate Node does not trust by default.
  ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

// Hosted poolers drop idle connections; without this listener that would crash the server.
pool.on('error', (err) => console.error('Database connection error:', err.message));
