import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const sql = await fs.readFile(path.join(__dirname, '../../sql/schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema applied.');
  await pool.end();
}

init().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
