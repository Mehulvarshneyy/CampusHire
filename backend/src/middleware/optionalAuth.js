import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    const { rows } = await query(
      `SELECT id, email, role, is_active FROM users WHERE id = $1`,
      [payload.sub]
    );
    if (rows[0]?.is_active) req.user = rows[0];
  } catch {
    // Public access still allowed
  }
  next();
}
