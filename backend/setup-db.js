import { readFile } from 'node:fs/promises';
import { pool } from './db.js';

const allowReset = process.argv.includes('--reset');

try {
  const { rows } = await pool.query(`SELECT count(*)::int AS tables FROM information_schema.tables WHERE table_schema = 'public'`);

  if (rows[0].tables > 0 && !allowReset) {
    console.error('This database already has tables in it, so nothing was changed. To erase the AgriRelay tables and reload the demo data, run "npm run db:setup -- --reset".');
    process.exitCode = 1;
  } else {
    await pool.query(await readFile(new URL('../database.sql', import.meta.url), 'utf8'));
    console.log('Database is ready.');
  }
} catch (err) {
  console.error('Could not set up the database:', err.message || err.code || err.errors?.[0]?.code || err.name);
  process.exitCode = 1;
} finally {
  await pool.end();
}
