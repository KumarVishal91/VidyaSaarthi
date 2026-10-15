import { Router } from 'express';
import { q } from '../db.js';
import { ah } from '../util.js';

const router = Router();

// Which rows a person may see depends on their role.
function scope(user) {
  if (user.role === 'admin') return { where: "role = 'admin'", params: [] };
  if (user.role === 'teacher') {
    return {
      where: "role = 'teacher' AND (student_id IS NULL OR student_id IN (SELECT id FROM students WHERE class_name = $1))",
      params: [user.className],
    };
  }
  return { where: 'role = $1 AND (student_id IS NULL OR student_id = $2)', params: [user.role, user.studentId] };
}

router.get('/', ah(async (req, res) => {
  const { where, params } = scope(req.user);
  const { rows: seen } = await q('SELECT notif_seen_at FROM users WHERE id = $1', [req.user.sub]);
  const seenAt = new Date(seen[0].notif_seen_at);
  const { rows } = await q(
    `SELECT id, title, body, created_at FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT 30`, params);
  const items = rows.map((r) => ({ id: r.id, title: r.title, body: r.body, createdAt: r.created_at, unread: new Date(r.created_at) > seenAt }));
  res.json({ items, unread: items.filter((i) => i.unread).length });
}));

router.post('/seen', ah(async (req, res) => {
  await q('UPDATE users SET notif_seen_at = now() WHERE id = $1', [req.user.sub]);
  res.json({ ok: true });
}));

export default router;
