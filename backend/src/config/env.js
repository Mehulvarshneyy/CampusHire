import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT || 5001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || 'admin@campushire.edu',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || 'Admin@123'
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

if (!env.jwtSecret || env.jwtSecret.length < 16) {
  throw new Error('JWT_SECRET must be at least 16 characters');
}
