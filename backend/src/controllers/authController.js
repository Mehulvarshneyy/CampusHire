import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, unauthorized, conflict } from '../utils/httpError.js';
import { isEmail, requireFields } from '../utils/validate.js';

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

async function loadSession(userId) {
  const { rows } = await query(
    `SELECT u.id, u.email, u.role, u.is_active, u.created_at,
            sp.id AS student_profile_id, sp.full_name AS student_name,
            rp.id AS recruiter_profile_id, rp.full_name AS recruiter_name,
            rp.approval_status, c.name AS company_name
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN recruiter_profiles rp ON rp.user_id = u.id
     LEFT JOIN companies c ON c.id = rp.company_id
     WHERE u.id = $1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    profile: {
      studentProfileId: row.student_profile_id,
      recruiterProfileId: row.recruiter_profile_id,
      fullName: row.student_name || row.recruiter_name || 'Administrator',
      approvalStatus: row.approval_status,
      companyName: row.company_name
    }
  };
}

export const register = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['STUDENT', 'RECRUITER'].includes(role)) {
    throw badRequest('Role must be STUDENT or RECRUITER');
  }
  requireFields(req.body, ['email', 'password', 'fullName']);
  if (!isEmail(req.body.email)) throw badRequest('Enter a valid email address');
  if (String(req.body.password).length < 8) {
    throw badRequest('Password must be at least 8 characters');
  }

  const email = String(req.body.email).toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount) throw conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(req.body.password, 12);

  const user = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
      [email, passwordHash, role]
    );
    const created = rows[0];

    if (role === 'STUDENT') {
      await client.query(
        `INSERT INTO student_profiles (user_id, full_name, college, department, graduation_year, cgpa)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          created.id,
          req.body.fullName.trim(),
          req.body.college || null,
          req.body.department || null,
          req.body.graduationYear ? Number(req.body.graduationYear) : null,
          req.body.cgpa ? Number(req.body.cgpa) : null
        ]
      );
    } else {
      let companyId = null;
      if (req.body.companyName) {
        const company = await client.query(
          `INSERT INTO companies (name, industry, location)
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [req.body.companyName.trim(), req.body.industry || null, req.body.companyLocation || null]
        );
        companyId = company.rows[0].id;
      }
      await client.query(
        `INSERT INTO recruiter_profiles (user_id, company_id, full_name, designation, phone)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          created.id,
          companyId,
          req.body.fullName.trim(),
          req.body.designation || null,
          req.body.phone || null
        ]
      );
    }

    return created;
  });

  const token = signToken(user);
  const session = await loadSession(user.id);
  res.status(201).json({ token, user: session });
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const email = String(req.body.email).toLowerCase().trim();
  const { rows } = await query(
    `SELECT id, password_hash, is_active FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user || !user.is_active) throw unauthorized('Invalid email or password');
  const match = await bcrypt.compare(req.body.password, user.password_hash);
  if (!match) throw unauthorized('Invalid email or password');

  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  const session = await loadSession(user.id);
  const token = signToken({ id: user.id, role: session.role });
  res.json({ token, user: session });
});

export const me = asyncHandler(async (req, res) => {
  const session = await loadSession(req.user.id);
  res.json({ user: session });
});
