import { badRequest } from './httpError.js';

export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length) {
    throw badRequest(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').toLowerCase());
}

export function sanitizeStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeIntArray(value) {
  return sanitizeStringArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));
}
