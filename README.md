# VidyaSaarthi

A rural school support platform. It brings four everyday jobs into one place: student records, attendance, supply tracking and parent communication. It also flags students who may be falling behind and offers a multilingual study assistant.

**Stack:** Next.js (React), Node.js and Express, PostgreSQL, Redis, Socket.IO, JWT with role-based access control, and an AI assistant (Claude API, optional).

## Run it

You need Node.js 20 or newer and Docker (for PostgreSQL and Redis).

```bash
# 1. Start PostgreSQL and Redis
docker compose up -d

# 2. API
cd server
cp .env.example .env
npm install
npm run db:init      # creates the tables
npm run seed         # loads a demo class, marks and accounts
npm run dev          # http://localhost:4000

# 3. Web app (new terminal)
cd web
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

Demo accounts (password `demo1234`): `principal@demo.in` (admin), `sunita@demo.in` (teacher), `aarav@demo.in` (student), `dinesh@demo.in` (parent of Rohan, who is flagged).

Sign-up needs an admission number for students and parents (`VS-2401` to `VS-2412`) and a staff code for teachers (`STAFF_CODE` in `server/.env`, default `STAFF-142`). Admin accounts are created by the seed or promoted by an admin. They cannot be self-registered.

Redis is optional while developing. If it is not running, the API logs a warning and reads from PostgreSQL directly.

## What each role gets

| Role | Can do |
| --- | --- |
| Student | See own attendance, marks, resources. Ask Saarthi. |
| Parent | See their child's attendance and marks, plain-language warning reasons, message the teacher, get live alerts. |
| Teacher | See the class roster, take attendance, see early warnings, message parents, add resources. |
| Admin | School-wide stats, early warnings, supplies inventory, user and role management. |

## How it fits together

```
web/                       Next.js app router, client components
  app/login, app/signup
  app/dashboard/...        one folder per page, content switches on role
  lib/api.js               fetch wrapper (sends the session cookie)
  lib/socket.js            shared Socket.IO connection
server/
  db/schema.sql            PostgreSQL tables
  src/index.js             Express app, route mounting, error handler
  src/auth.js              JWT sign and verify, requireRole, assertStudentAccess
  src/risk.js              early-warning score, class summaries cached in Redis
  src/notify.js            saves a notification, pushes it over Socket.IO
  src/socket.js            Socket.IO auth (same JWT) and rooms
  src/routes/*             one file per resource
```

**Auth and RBAC.** Login sets an httpOnly cookie holding a JWT (8 hours) with the user's id, role, linked student and class. `authenticate` checks it on every `/api` route. `requireRole('teacher')` guards routes by role. `assertStudentAccess` adds a row-level rule: a parent reads only their own child, a teacher only their own class.

**Early-warning score.** `server/src/risk.js` scores each student from the last 20 school days of attendance and the trend in marks. The rules are listed on the Warnings page. Change the thresholds in `riskOf()`.

**Redis.** Class summaries are cached for 60 seconds under `class:<name>:summary`. Saving attendance clears the key, so teachers never see stale numbers after their own change.

**Real-time alerts.** When a teacher saves attendance, newly absent students trigger a notification to their parents, and a student whose risk level rises triggers one to teachers and admins. Each notification is saved in PostgreSQL and pushed to Socket.IO rooms (`role:parent:<studentId>`, `class:<name>`, `role:admin`). The browser also loads the list over REST, so a refresh loses nothing.

**Saarthi assistant.** `POST /api/assistant` calls the Claude Messages API when `ANTHROPIC_API_KEY` is set. Without a key it returns a short built-in reply. The language (English or Hindi) is passed from the page. Replies are limited to 20 a minute per IP.

## Before you put it in front of real children

This is a starter. These gaps are deliberate and worth closing first:

- Use HTTPS, set a long random `JWT_SECRET`, and serve the web app and API from the same site so the cookie stays `sameSite: lax`.
- Disabled accounts and role changes take effect at the next sign-in, because the role lives in the token. For instant revocation, check `users.active` inside `authenticate` or add refresh tokens with a short access token.
- The rate limiter is in memory. Use a Redis-backed one if you run more than one API process.
- Add a password reset flow and email verification.
- Student data is sensitive. Agree who may see what with the school, keep backups, and follow the privacy rules that apply to you (for example India's DPDP Act for children's data).
- The assistant sends the typed question to an AI provider. Do not paste names or personal details into it, and review the system prompt in `server/src/routes/assistant.js`.
- Add tests. The early-warning function in `risk.js` is pure and easy to unit test first.

## Ideas for next steps

Offline mode with a service worker and queued attendance, SMS alerts for parents without smartphones, more languages in the assistant, a timetable and homework module, and report cards as PDF.
