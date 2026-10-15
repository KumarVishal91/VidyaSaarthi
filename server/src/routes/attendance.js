import { Router } from 'express';
import { z } from 'zod';
import { pool, q } from '../db.js';
import { requireRole } from '../auth.js';
import { ah, HttpError, localISO } from '../util.js';
import { bustClass, computeClass, worse } from '../risk.js';
import { notify } from '../notify.js';

const router = Router();

// The class register for one day. Students with no mark yet come back with status null.
router.get('/class', requireRole('teacher'), ah(async (req, res) => {
  const date = String(req.query.date || localISO());
  const { rows } = await q(
    `SELECT s.id, s.name, s.roll, a.status FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $2
     WHERE s.class_name = $1 ORDER BY s.roll`, [req.user.className, date]);
  res.json({ date, students: rows });
}));

const saveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  marks: z.array(z.object({ studentId: z.number().int(), status: z.enum(['P', 'L', 'A']) })).min(1).max(200),
});

router.post('/', requireRole('teacher'), ah(async (req, res) => {
  const b = saveSchema.parse(req.body);
  const className = req.user.className;

  const ageDays = (Date.now() - new Date(b.date).getTime()) / 86_400_000;
  if (ageDays > 7 || ageDays < -1) throw new HttpError(400, 'Attendance can be saved for the last 7 days only');

  // Teachers can only mark their own class.
  const ids = [...new Set(b.marks.map((m) => m.studentId))];
  const { rows: own } = await q(
    'SELECT id, name FROM students WHERE class_name = $1 AND id = ANY($2::int[])', [className, ids]);
  if (own.length !== ids.length) throw new HttpError(403, 'Some students are not in your class');
  const names = new Map(own.map((s) => [s.id, s.name]));

  const { rows: prevRows } = await q(
    'SELECT student_id, status FROM attendance WHERE date = $1 AND student_id = ANY($2::int[])', [b.date, ids]);
  const prev = new Map(prevRows.map((r) => [r.student_id, r.status]));
  const before = new Map((await computeClass(className)).map((s) => [s.id, s.risk.level]));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const m of b.marks) {
      await client.query(
        `INSERT INTO attendance (student_id, date, status, marked_by) VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
        [m.studentId, b.date, m.status, req.user.sub]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  await bustClass(className);
  const after = await computeClass(className);

  // Tell parents only when a child newly becomes absent, so saving twice does not repeat the alert.
  let parentsNotified = 0;
  for (const m of b.marks) {
    if (m.status === 'A' && prev.get(m.studentId) !== 'A') {
      const first = names.get(m.studentId).split(' ')[0];
      await notify({
        role: 'parent', studentId: m.studentId,
        title: `${first} was absent`,
        body: `Marked absent on ${b.date}. Please tell the school if there is a reason.`,
      });
      parentsNotified += 1;
    }
  }

  // Early-warning alerts go out when a student moves to a worse level.
  for (const s of after) {
    if (worse(s.risk.level, before.get(s.id) || 'low')) {
      const body = `${s.name}: ${s.risk.why[0] || 'trend has changed'}.`;
      await notify({ role: 'teacher', studentId: s.id, className, title: 'Early warning', body });
      await notify({ role: 'admin', studentId: s.id, title: `Early warning in ${className}`, body });
    }
  }

  res.json({ saved: b.marks.length, parentsNotified });
}));

export default router;
