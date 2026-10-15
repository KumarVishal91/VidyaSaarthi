import http from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { config } from './config.js';
import { authenticate } from './auth.js';
import { attachSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import messageRoutes from './routes/messages.js';
import resourceRoutes from './routes/resources.js';
import inventoryRoutes from './routes/inventory.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import assistantRoutes from './routes/assistant.js';
import overviewRoutes from './routes/overview.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

// Everything below needs a valid session. Each router then adds its own role rules.
app.use('/api', authenticate);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api', overviewRoutes);

app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message || 'Check the form and try again' });
  }
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Try again.' });
});

const server = http.createServer(app);
attachSocket(server);
server.listen(config.port, () => console.log(`VidyaSaarthi API on http://localhost:${config.port}`));
