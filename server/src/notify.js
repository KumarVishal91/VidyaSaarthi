import { q } from './db.js';

let io = null;
export const setIo = (instance) => { io = instance; };

// Rooms: role:admin, class:8-A (teachers), role:parent:<studentId>, role:student:<studentId>.
function room(role, studentId, className) {
  if (role === 'teacher') return className ? `class:${className}` : 'role:teacher';
  if (role === 'admin') return 'role:admin';
  return studentId ? `role:${role}:${studentId}` : `role:${role}`;
}

export function emitTo(role, studentId, className, event, payload) {
  if (io) io.to(room(role, studentId, className)).emit(event, payload);
}

// Saves the notification (so it survives a refresh) and pushes it to anyone connected right now.
export async function notify({ role, studentId = null, className = null, title, body }) {
  const { rows } = await q(
    'INSERT INTO notifications(role, student_id, title, body) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
    [role, studentId, title, body]);
  emitTo(role, studentId, className, 'notification', { id: rows[0].id, title, body, createdAt: rows[0].created_at, unread: true });
}
