import { Router } from 'express';
import { q } from '../db.js';
import { assertStudentAccess, requireRole } from '../auth.js';
import { classSummary, studentSummary } from '../risk.js';
import { ah } from '../util.js';

const router = Router();

// Class roster with attendance, marks and early-warning level.
router.get('/', requireRole('teacher', 'admin'), ah(async (req, res) => {
  const className = req.user.role === 'teacher' ? req.user.className : String(req.query.class || '8-A');
  res.json({ className, students: await classSummary(className) });
}));

router.get('/:id/summary', ah(async (req, res) => {
  const id = Number(req.params.id);
  await assertStudentAccess(req.user, id);
  const s = await studentSummary(id);
  // Students see a supportive status, not the scoring detail. Parents, teachers and admins see the reasons.
  if (req.user.role === 'student') s.risk = { level: s.risk.level, score: null, why: [] };
  res.json(s);
}));

router.get('/:id/attendance', ah(async (req, res) => {
  const id = Number(req.params.id);
  await assertStudentAccess(req.user, id);
  const { rows } = await q(
    `SELECT to_char(date, 'YYYY-MM-DD') AS date, status FROM attendance
     WHERE student_id = $1 AND date >= CURRENT_DATE - 45 ORDER BY date`, [id]);
  res.json({ days: rows });
}));

export default router;
