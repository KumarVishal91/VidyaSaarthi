import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { requireRole } from '../auth.js';
import { ah } from '../util.js';
import { notify } from '../notify.js';

const router = Router();

router.get('/', ah(async (req, res) => {
  const { rows } = await q('SELECT id, title, subject, type, language FROM resources ORDER BY created_at DESC');
  res.json({ resources: rows });
}));

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  subject: z.string().trim().min(2).max(40),
  type: z.enum(['PDF', 'Audio', 'Video']),
  language: z.enum(['Hindi', 'English']),
});

router.post('/', requireRole('teacher'), ah(async (req, res) => {
  const b = schema.parse(req.body);
  const { rows } = await q(
    'INSERT INTO resources (title, subject, type, language, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, subject, type, language',
    [b.title, b.subject, b.type, b.language, req.user.sub]);
  await notify({ role: 'student', title: 'New resource', body: `${b.subject}: ${b.title}` });
  res.status(201).json({ resource: rows[0] });
}));

export default router;
