import { q } from './db.js';
import { cached, bust } from './cache.js';
import { HttpError } from './util.js';

const rate = (s) => (s.length ? [...s].filter((c) => c !== 'A').length / s.length : 1);
const RANK = { low: 0, medium: 1, high: 2 };
export const worse = (after, before) => RANK[after] > RANK[before];

// att: attendance string for the last 20 school days, oldest first (P present, L late, A absent).
// m0 and m2: average marks (%) in the first and the latest assessment.
export function riskOf({ att, m0, m2 }) {
  const recent = rate(att.slice(-10));
  const prev = rate(att.slice(-20, -10));
  const drop = prev - recent;
  const mdrop = m0 - m2;
  let score = 0;
  const why = [];

  if (recent < 0.75) { score += 35; why.push(`Attended ${Math.round(recent * 100)}% of the last 10 school days`); }
  else if (recent < 0.85) { score += 15; why.push(`Attended ${Math.round(recent * 100)}% of the last 10 school days`); }
  if (drop > 0.15) { score += 25; why.push(`Attendance fell ${Math.round(drop * 100)} points compared with the 10 days before`); }
  const run = att.match(/A+$/);
  if (run && run[0].length >= 3) { score += 15; why.push(`Absent ${run[0].length} days in a row`); }
  if (m2 < 50) { score += 25; why.push(`Average marks are ${Math.round(m2)}%, below the pass mark`); }
  else if (m2 < 60) { score += 10; why.push(`Average marks are ${Math.round(m2)}%`); }
  if (mdrop >= 8) { score += 20; why.push(`Marks are down ${Math.round(mdrop)} points since the first assessment`); }

  const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
  return { level, score: Math.min(score, 100), why };
}

export async function computeClass(className) {
  const { rows: students } = await q(
    'SELECT id, name, roll, admission_no FROM students WHERE class_name = $1 ORDER BY roll', [className]);
  const { rows: att } = await q(
    `SELECT a.student_id, a.status FROM attendance a JOIN students s ON s.id = a.student_id
     WHERE s.class_name = $1 AND a.date >= CURRENT_DATE - 45 ORDER BY a.date`, [className]);
  const { rows: tests } = await q(
    `SELECT x.student_id, x.test_name, AVG(x.score * 100.0 / x.max_score) AS avg, MIN(x.taken_on) AS d
     FROM assessments x JOIN students s ON s.id = x.student_id
     WHERE s.class_name = $1 GROUP BY x.student_id, x.test_name ORDER BY d`, [className]);

  const attBy = new Map();
  for (const r of att) attBy.set(r.student_id, (attBy.get(r.student_id) || '') + r.status);
  const testBy = new Map();
  for (const r of tests) testBy.set(r.student_id, [...(testBy.get(r.student_id) || []), Number(r.avg)]);

  return students.map((s) => {
    const a = (attBy.get(s.id) || '').slice(-20);
    const t = testBy.get(s.id) || [0];
    const m0 = t[0];
    const m2 = t[t.length - 1];
    const weekly = [0, 1, 2, 3].map((i) => Math.round(rate(a.slice(i * 5, i * 5 + 5)) * 100));
    return {
      id: s.id,
      name: s.name,
      roll: s.roll,
      admissionNo: s.admission_no,
      attendancePct: Math.round(rate(a) * 100),
      recent: a.slice(-10),
      weekly,
      avgMarks: Math.round(m2),
      marksChange: Math.round(m2 - m0),
      risk: riskOf({ att: a, m0, m2 }),
    };
  });
}

// Cached for 60 seconds. Saving attendance clears the key so teachers see their own change at once.
export const classSummary = (className) => cached(`class:${className}:summary`, 60, () => computeClass(className));
export const bustClass = (className) => bust(`class:${className}:summary`);

export async function studentSummary(studentId) {
  const { rows } = await q('SELECT class_name FROM students WHERE id = $1', [studentId]);
  if (!rows.length) throw new HttpError(404, 'Student not found');
  const className = rows[0].class_name;
  const entry = (await classSummary(className)).find((s) => s.id === studentId);

  const { rows: bySubject } = await q(
    `SELECT subject, test_name, AVG(score * 100.0 / max_score) AS avg, MIN(taken_on) AS d
     FROM assessments WHERE student_id = $1 GROUP BY subject, test_name ORDER BY subject, d`, [studentId]);
  const subjects = {};
  for (const r of bySubject) (subjects[r.subject] ||= []).push(Math.round(Number(r.avg)));

  const { rows: cls } = await q(
    `SELECT x.test_name, AVG(x.score * 100.0 / x.max_score) AS avg, MIN(x.taken_on) AS d
     FROM assessments x JOIN students s ON s.id = x.student_id
     WHERE s.class_name = $1 GROUP BY x.test_name ORDER BY d`, [className]);

  return {
    ...entry,
    className,
    subjects: Object.entries(subjects).map(([subject, scores]) => ({ subject, scores })),
    tests: cls.map((r) => r.test_name),
    classAverage: cls.map((r) => Math.round(Number(r.avg))),
  };
}
