import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 10;

const officerId = process.argv[2];

try {
  if (!officerId) {
    const { rows } = await pool.query(`SELECT id, name, zone, password_hash IS NOT NULL AS "hasPassword" FROM officers ORDER BY id`);
    console.log('Usage: npm run officer:password -- <officer id>\n');
    rows.forEach((o) => console.log(`${o.id.padEnd(14)} ${o.name.padEnd(18)} ${o.zone.padEnd(8)} ${o.hasPassword ? 'password set' : 'no password yet'}`));
  } else {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    const password = await prompt.question(`New password for ${officerId}: `);
    prompt.close();

    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters. Nothing was changed.`);
      process.exitCode = 1;
    } else {
      const hash = await bcrypt.hash(password, BCRYPT_COST);
      const { rowCount } = await pool.query('UPDATE officers SET password_hash = $1 WHERE id = $2', [hash, officerId]);
      if (rowCount === 0) {
        console.error(`No officer has the ID ${officerId}. Run this command without an ID to list them.`);
        process.exitCode = 1;
      } else {
        console.log(`Password saved for ${officerId}.`);
      }
    }
  }
} catch (err) {
  console.error('Could not update the password:', err.message || err.code || err.name);
  process.exitCode = 1;
} finally {
  await pool.end();
}
