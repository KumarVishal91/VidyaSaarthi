import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { requireRole } from '../auth.js';
import { ah, HttpError } from '../util.js';

const router = Router();
router.use(requireRole('admin'));

router.get('/', ah(async (req, res) => {
  const { rows } = await q(
    `SELECT u.id, u.name, u.email, u.role, u.active, u.class_name, s.name AS student_name
     FROM users u LEFT JOIN students s ON s.id = u.student_id ORDER BY u.id`);
  res.json({ users: rows });
}));

const patchSchema = z.object({
  role: z.enum(['student', 'parent', 'teacher', 'admin']).optional(),
  active: z.boolean().optional(),
}).refine((b) => b.role !== undefined || b.active !== undefined, 'Nothing to change');

// A role change applies when the person next signs in, because the role is stored in their token.
router.patch('/:id', ah(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.sub) throw new HttpError(400, 'You cannot change your own role or status');
  const b = patchSchema.parse(req.body);
  const { rows } = await q(
    'UPDATE users SET role = COALESCE($1, role), active = COALESCE($2, active) WHERE id = $3 RETURNING id, name, role, active',
    [b.role ?? null, b.active ?? null, id]);
  if (!rows.length) throw new HttpError(404, 'User not found');
  res.json({ user: rows[0] });
}));

export default router;
