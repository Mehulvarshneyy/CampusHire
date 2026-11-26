import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const server = app.listen(env.port, () => {
  console.log(`CampusHire API running on http://localhost:${env.port}`);
});

process.on('SIGTERM', async () => {
  server.close();
  await pool.end();
});
