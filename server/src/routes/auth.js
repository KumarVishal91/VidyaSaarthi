import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { q } from '../db.js';
import { config } from '../config.js';
import { authenticate, publicUser, startSession } from '../auth.js';
import { ah, HttpError, limit } from '../util.js';

const router = Router();

// Admin accounts are not self-service. The first admin comes from the seed; admins promote others.
const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
  role: z.enum(['student', 'parent', 'teacher']),
  code: z.string().trim().min(1, 'Enter the admission number or staff code'),
  className: z.string().trim().optional(),
});

router.post('/signup', limit(10, 60_000), ah(async (req, res) => {
  const b = signupSchema.parse(req.body);
  let studentId = null;
  let className = null;

  if (b.role === 'teacher') {
    if (b.code.toUpperCase() !== config.staffCode.toUpperCase()) throw new HttpError(400, 'This staff code is not valid');
    className = b.className || '8-A';
  } else {
    const { rows } = await q('SELECT id FROM students WHERE admission_no = $1', [b.code.toUpperCase()]);
    if (!rows.length) throw new HttpError(400, 'No student has this admission number');
    studentId = rows[0].id;
  }

  const hash = await bcrypt.hash(b.password, 10);
  try {
    const { rows } = await q(
      `INSERT INTO users (name, email, password_hash, role, student_id, class_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [b.name, b.email.toLowerCase(), hash, b.role, studentId, className]);
    startSession(res, rows[0]);
    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'This email already has an account');
    throw e;
  }
}));

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

router.post('/login', limit(10, 60_000), ah(async (req, res) => {
  const b = loginSchema.parse(req.body);
  const { rows } = await q('SELECT * FROM users WHERE email = $1', [b.email.toLowerCase()]);
  const user = rows[0];
  // Same message for unknown email and wrong password, so the form does not reveal which emails exist.
  if (!user || !(await bcrypt.compare(b.password, user.password_hash))) {
    throw new HttpError(401, 'Email or password is not correct');
  }
  if (!user.active) throw new HttpError(403, 'This account is disabled. Ask the school office.');
  startSession(res, user);
  res.json({ user: publicUser(user) });
}));

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authenticate, ah(async (req, res) => {
  const { rows } = await q('SELECT * FROM users WHERE id = $1', [req.user.sub]);
  if (!rows.length || !rows[0].active) return res.status(401).json({ error: 'Sign in to continue' });
  res.json({ user: publicUser(rows[0]) });
}));

export default router;
