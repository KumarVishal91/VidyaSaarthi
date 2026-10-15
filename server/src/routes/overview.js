import { Router } from 'express';
import { q } from '../db.js';
import { requireRole } from '../auth.js';
import { classSummary } from '../risk.js';
import { ah } from '../util.js';

const router = Router();

router.get('/warnings', requireRole('teacher', 'admin'), ah(async (req, res) => {
  const className = req.user.role === 'teacher' ? req.user.className : String(req.query.class || '8-A');
  const all = await classSummary(className);
  const flagged = all.filter((s) => s.risk.level !== 'low').sort((a, b) => b.risk.score - a.risk.score);
  res.json({ className, flagged, everyone: [...all].sort((a, b) => b.risk.score - a.risk.score) });
}));

router.get('/stats', requireRole('admin'), ah(async (req, res) => {
  const { rows: classes } = await q('SELECT DISTINCT class_name FROM students ORDER BY class_name');
  const perClass = [];
  for (const c of classes) {
    const list = await classSummary(c.class_name);
    perClass.push({
      className: c.class_name,
      students: list.length,
      attendancePct: list.length ? Math.round(list.reduce((a, s) => a + s.attendancePct, 0) / list.length) : 0,
      flagged: list.filter((s) => s.risk.level !== 'low').length,
    });
  }
  const { rows: low } = await q('SELECT COUNT(*)::int AS n FROM inventory_items WHERE stock < needed * 0.9');
  const students = perClass.reduce((a, c) => a + c.students, 0);
  res.json({
    students,
    attendancePct: students ? Math.round(perClass.reduce((a, c) => a + c.attendancePct * c.students, 0) / students) : 0,
    flagged: perClass.reduce((a, c) => a + c.flagged, 0),
    lowSupplies: low[0].n,
    perClass,
  });
}));

export default router;
