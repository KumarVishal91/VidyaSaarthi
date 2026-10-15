import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { assertStudentAccess, requireRole } from '../auth.js';
import { ah } from '../util.js';
import { emitTo, notify } from '../notify.js';

const router = Router();

// One thread per student: the class teacher and that student's parent.
router.get('/:studentId', requireRole('teacher', 'parent'), ah(async (req, res) => {
  const id = Number(req.params.studentId);
  await assertStudentAccess(req.user, id);
  const { rows } = await q(
    `SELECT m.id, m.sender_role, m.body, m.created_at, u.name AS sender_name
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.student_id = $1 ORDER BY m.created_at`, [id]);
  res.json({ messages: rows });
}));

router.post('/:studentId', requireRole('teacher', 'parent'), ah(async (req, res) => {
  const id = Number(req.params.studentId);
  await assertStudentAccess(req.user, id);
  const { body } = z.object({ body: z.string().trim().min(1).max(1000) }).parse(req.body);

  const { rows } = await q(
    `INSERT INTO messages (student_id, sender_role, sender_id, body) VALUES ($1, $2, $3, $4)
     RETURNING id, sender_role, body, created_at`, [id, req.user.role, req.user.sub, body]);

  const { rows: st } = await q('SELECT name, class_name FROM students WHERE id = $1', [id]);
  const first = st[0].name.split(' ')[0];
  const payload = { studentId: id };
  emitTo('teacher', null, st[0].class_name, 'message', payload);
  emitTo('parent', id, null, 'message', payload);

  if (req.user.role === 'teacher') {
    await notify({ role: 'parent', studentId: id, title: 'New message from the teacher', body: body.slice(0, 90) });
  } else {
    await notify({ role: 'teacher', studentId: id, className: st[0].class_name, title: `Reply about ${first}`, body: body.slice(0, 90) });
  }
  res.status(201).json({ message: { ...rows[0], sender_name: req.user.name } });
}));

export default router;
