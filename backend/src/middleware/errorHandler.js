import { env } from '../config/env.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Endpoint not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  let message = status === 500 ? 'Internal server error' : err.message;

  if (err.code === 'ECONNREFUSED') {
    message = 'Database is offline. Please start PostgreSQL: npm run db:local --prefix backend';
  } else if (err.code === '42P01') {
    message = 'Database tables not found. Please run: npm run db:init && npm run db:seed';
  } else if (err.code === '3D000') {
    message = 'Database "campushire" does not exist. Please run: npm run db:local --prefix backend';
  }

  const payload = {
    message
  };
  if (err.details) payload.details = err.details;
  if (env.nodeEnv !== 'production' && status === 500) {
    payload.debug = err.message;
  }
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json(payload);
}
