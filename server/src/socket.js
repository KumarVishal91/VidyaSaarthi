import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { setIo } from './notify.js';

export function attachSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: config.webOrigin, credentials: true } });

  // Same JWT as the REST API, read from the httpOnly cookie.
  io.use((socket, next) => {
    try {
      const { token } = cookie.parse(socket.handshake.headers.cookie || '');
      socket.user = jwt.verify(token, config.jwtSecret);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.user;
    socket.join(`role:${u.role}`);
    if (u.studentId) socket.join(`role:${u.role}:${u.studentId}`);
    if (u.role === 'teacher' && u.className) socket.join(`class:${u.className}`);
  });

  setIo(io);
  return io;
}
