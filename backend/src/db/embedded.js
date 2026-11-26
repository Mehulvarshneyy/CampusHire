import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PG_PORT || 5432);
const user = process.env.PG_USER || 'campushire';
const password = process.env.PG_PASSWORD || 'campushire';
const database = process.env.PG_DATABASE || 'campushire';
const databaseDir = path.join(__dirname, '../../.pgdata');

const postgres = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  autoRehydrateSymlinks: true,
  onLog: (message) => process.stdout.write(String(message))
});

const isInitialized = fs.existsSync(path.join(databaseDir, 'PG_VERSION'));
if (!isInitialized) {
  await postgres.initialise();
}

// Remove stale postmaster.pid if postgres is not running
const pidFile = path.join(databaseDir, 'postmaster.pid');
if (fs.existsSync(pidFile)) {
  try {
    fs.unlinkSync(pidFile);
  } catch {
    // Ignore error if file is locked or cannot be removed
  }
}

await postgres.start();

try {
  await postgres.createDatabase(database);
} catch (error) {
  const text = String(error?.message || error);
  if (!/already exists/i.test(text)) throw error;
}

console.log(`Embedded PostgreSQL ready on port ${port} (database ${database})`);

const stop = async () => {
  await postgres.stop();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
