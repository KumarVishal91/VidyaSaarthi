import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { q } from './db.js';
import { HttpError } from './util.js';

const EIGHT_HOURS = 8 * 60 * 60;

export function signToken(u) {
  return jwt.sign(
    { sub: u.id, role: u.role, name: u.name, studentId: u.student_id ?? null, className: u.class_name ?? null },
    config.jwtSecret,
    { expiresIn: EIGHT_HOURS },
  );
}

export function startSession(res, userRow) {
  res.cookie('token', signToken(userRow), {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: EIGHT_HOURS * 1000,
  });
}

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  studentId: u.student_id ?? null,
  className: u.class_name ?? null,
});

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'Sign in to continue' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }
}

// RBAC: list the roles that may reach a route.
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Your role cannot do this' });

// Row-level rule on top of the role check: students and parents see only their own child,
// teachers see only their class, admins see everyone.
export async function assertStudentAccess(user, studentId) {
  if (user.role === 'admin') return;
  if (user.role === 'student' || user.role === 'parent') {
    if (user.studentId !== studentId) throw new HttpError(403, 'You can only see your own records');
    return;
  }
  const { rows } = await q('SELECT 1 FROM students WHERE id = $1 AND class_name = $2', [studentId, user.className]);
  if (!rows.length) throw new HttpError(403, 'This student is not in your class');
}
