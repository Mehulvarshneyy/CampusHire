import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 40`,
    [req.user.id]
  );
  const unread = rows.filter((item) => !item.is_read).length;
  res.json({ notifications: rows, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [req.user.id]);
  res.json({ success: true });
});
