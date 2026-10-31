# 🎓 VidyaSaarthi – AI-Powered Rural School Support Platform

<p align="center">
  An intelligent school management platform designed to improve student monitoring, simplify school operations, and strengthen communication between teachers, parents, and students.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-Frontend-black?logo=next.js" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-API-lightgrey?logo=express" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql" />
  <img src="https://img.shields.io/badge/Redis-Caching-red?logo=redis" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-black?logo=socket.io" />
  <img src="https://img.shields.io/badge/AI-Claude%20API-purple" />
</p>

---

## 📌 Overview

**VidyaSaarthi** is a full-stack, AI-powered school support platform designed to address operational and educational challenges faced by rural schools.

In many schools, student records, attendance, academic performance, resource management, and parent communication are handled separately. This makes it difficult for teachers and school administrators to monitor students effectively and identify learning difficulties at an early stage.

VidyaSaarthi brings these activities together in one platform.

It provides role-based dashboards for students, parents, teachers, and administrators, allowing each user to access relevant information and perform their respective tasks.

The platform also includes an early-warning system that analyzes attendance patterns and academic performance to identify students who may need additional attention.

An integrated multilingual AI assistant, Saarthi, provides students with an accessible way to ask educational questions in English or Hindi.

## 🎯 Problem Statement

Rural schools often face challenges such as:

- Fragmented student records and attendance management.
- Limited visibility into student academic progress.
- Delayed communication between parents and teachers.
- Difficulty identifying students at risk of falling behind.
- Limited access to personalized learning assistance.
- Inefficient tracking of school supplies and resources.

**VidyaSaarthi addresses these challenges through a centralized, real-time, and intelligent school management platform.**

---

## ✨ Key Features

### 1. 👨‍🎓 Student Management
- Maintain centralized student records.
- Access attendance history and academic marks.
- View learning resources shared by teachers.
- Get personalized educational assistance through Saarthi.
- Access information through a student-specific dashboard.

### 2. 📊 Attendance Management
- Teachers can view their assigned class roster.
- Record and update daily student attendance.
- Track attendance patterns over time.
- Notify parents when their child is marked absent.
- Use attendance history as an input for early-warning analysis.

### 3. 🚨 Early-Warning System

One of the core features of VidyaSaarthi is its student early-warning mechanism.

The system evaluates student performance using:

- Attendance records from the last 20 school days.
- Academic marks and performance trends.
- Configurable risk-scoring rules.

Students showing concerning patterns are flagged for further attention.

Teachers and administrators can view identified students and understand the reasons behind their warning status.

This helps schools take action before academic difficulties become more serious.

### 4. 👨‍👩‍👦 Parent Dashboard
- Monitor children's attendance.
- View academic marks and progress.
- Understand early-warning notifications through simple explanations.
- Communicate directly with teachers.
- Receive real-time alerts about important student activities.

### 5. 👩‍🏫 Teacher Dashboard
- Access assigned class rosters.
- Record student attendance.
- Monitor academic performance.
- View students identified by the early-warning system.
- Communicate with parents.
- Share educational resources.

### 6. 🤖 Saarthi – AI Learning Assistant

Saarthi is an integrated AI-powered educational assistant designed to make learning support more accessible.

Features include:

- AI-powered question answering using the Claude API.
- Support for English and Hindi.
- Language selection based on student preference.
- Built-in fallback responses when the AI API key is unavailable.
- API rate limiting to control excessive requests.

The assistant provides an additional learning support channel for students.

### 7. ⚡ Real-Time Notifications
- Instant notifications using Socket.IO.
- Parents receive alerts when students are marked absent.
- Teachers and administrators receive alerts when a student's risk level increases.
- Notifications are stored in PostgreSQL.
- Users can retrieve previous notifications through REST APIs.

### 8. 📦 School Resource Management
- Track school supplies and inventory.
- Monitor resource availability.
- Provide administrators with centralized inventory management.

### 9. 🔐 Authentication & Role-Based Access Control
- JWT-based authentication.
- Secure HTTP-only session cookies.
- Role-based authorization.
- Protected API endpoints.
- Student-specific access restrictions.
- Separate permissions for students, parents, teachers, and administrators.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Caching | Redis |
| Real-Time Communication | Socket.IO |
| Authentication | JWT, HTTP-only Cookies |
| Authorization | Role-Based Access Control (RBAC) |
| AI Integration | Anthropic Claude API |
| Containerization | Docker, Docker Compose |

---

## 🏗️ System Architecture

VidyaSaarthi follows a client-server architecture with separate frontend and backend applications.

```text
                  VIDYASAARTHI
                       |
             +---------+---------+
             |                   |
         Next.js             Express.js
         Frontend             Backend API
             |                   |
        Role-Based          Authentication
        Dashboards          & RBAC Middleware
             |                   |
             |              API Routes
             |                   |
             |              Controllers
             |                   |
             |         +---------+---------+
             |         |         |         |
             |      PostgreSQL  Redis   Claude API
             |         |         |
             |         |      Caching
             |         |
             |      Student Data
             |      Attendance
             |      Marks
             |      Notifications
             |
             +------ Socket.IO ------+
                       |
                Real-Time Events
                       |
             Parents / Teachers /
                Administrators
```

### Core Architecture Components

| Component | Responsibility |
|---|---|
| Next.js | User interface and role-based dashboards |
| Express.js | REST API and business logic |
| PostgreSQL | Persistent student and school data |
| Redis | Cache class summaries |
| Socket.IO | Real-time notifications and communication |
| JWT | User authentication |
| RBAC | Role-based API authorization |
| Claude API | AI-powered educational assistance |

---

## 🔄 Important Application Workflows

### 1. Authentication Workflow

1. Users register according to their assigned role.
2. Students and parents provide an admission number.
3. Teachers provide a valid staff code.
4. Users authenticate through the login system.
5. The backend generates a JWT.
6. The token is stored in an HTTP-only cookie.
7. Authentication and authorization middleware protect API routes.

### 2. Student Early-Warning Workflow

1. The system retrieves attendance records from the last 20 school days.
2. It evaluates attendance patterns and academic performance trends.
3. The risk-scoring function calculates the student's warning status.
4. Identified students appear on the teacher and admin dashboards.
5. When a student's risk level increases, relevant teachers and administrators receive notifications.

### 3. Real-Time Notification Workflow

1. A teacher records student attendance.
2. The backend saves the updated attendance in PostgreSQL.
3. The system identifies newly absent students.
4. A notification is generated for the respective parents.
5. Socket.IO delivers the notification to the appropriate user room.
6. Notifications remain stored in PostgreSQL and can be retrieved later.

### 4. AI Assistant Workflow

1. A student opens the Saarthi assistant.
2. The student enters a question and selects a language.
3. The frontend sends a request to the backend.
4. The backend calls the Claude Messages API when configured.
5. The response is returned to the student.
6. If the API key is unavailable, the system provides a built-in fallback response.

---

## 📂 Project Structure

```text
VidyaSaarthi/
│
├── web/
│   ├── app/
│   │   ├── login/
│   │   ├── signup/
│   │   └── dashboard/
│   │       ├── student/
│   │       ├── parent/
│   │       ├── teacher/
│   │       └── admin/
│   │
│   ├── lib/
│   │   ├── api.js
│   │   └── socket.js
│   │
│   └── package.json
│
├── server/
│   ├── db/
│   │   └── schema.sql
│   │
│   ├── src/
│   │   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── risk.js
│   │   ├── notify.js
│   │   └── socket.js
│   │
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

Follow these steps to run VidyaSaarthi locally.

### Prerequisites

Install the following:

- Node.js 20 or newer.
- npm.
- Docker and Docker Compose.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/KumarVishal91/VidyaSaarthi.git

cd VidyaSaarthi
```

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d
```

This starts the required database and caching services.

### 3. Configure the Backend

```bash
cd server

cp .env.example .env

npm install
```

Configure your environment variables in `server/.env`.

Set the required database connection, JWT secret, staff code, and optional AI API configuration.

For the AI assistant, configure:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Run database initialization:

```bash
npm run db:init
```

Seed the database with demo data:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:4000
```

### 4. Configure the Frontend

Open a new terminal:

```bash
cd web

cp .env.example .env.local

npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## 🔑 Demo Accounts

The project provides seeded accounts for testing different user roles.

All demo accounts use the password:

`demo1234`

| Role | Email |
|---|---|
| Administrator | principal@demo.in |
| Teacher | sunita@demo.in |
| Student | aarav@demo.in |
| Parent | dinesh@demo.in |

Additional registration requirements:

- Student and parent accounts require an admission number.
- Demo admission numbers range from `VS-2401` to `VS-2412`.
- Teacher registration requires the configured staff code.
- Administrator accounts are created through database seeding or administrator promotion.

---

## ⚡ Performance & Technical Implementation

### Redis Caching

Redis is used to cache class summary information.

- Cache key format: `class:<name>:summary`
- Cache expiration: 60 seconds.
- Attendance updates invalidate the corresponding class summary cache.

This reduces repeated database queries when retrieving frequently accessed class statistics.

### Real-Time Communication

Socket.IO provides event-based communication between the backend and connected users.

Dedicated rooms are used for targeted notifications:

- `role:parent:<studentId>`
- `class:<name>`
- `role:admin`

This allows the backend to send notifications to relevant users instead of broadcasting every event to everyone.

### Access Control

The application implements multiple levels of authorization:

- `authenticate` verifies the JWT session.
- `requireRole()` restricts access based on user roles.
- `assertStudentAccess()` ensures users can access only permitted student records.

For example, parents can access their own child's records, while teachers are restricted to their assigned class.

### AI Request Protection

The Saarthi assistant applies rate limiting to control excessive requests.

- Maximum 20 requests per minute per IP.
- Claude API integration is optional.
- Built-in fallback behavior is available without an API key.

---

## 🔒 Security & Production Considerations

VidyaSaarthi is currently a development starter project. Before deploying it for real schools and students, the following improvements should be implemented:

- Enable HTTPS across the application.
- Use strong, randomly generated JWT secrets.
- Implement password reset and email verification.
- Add immediate session revocation for disabled accounts and changed roles.
- Use Redis-backed rate limiting for multi-instance deployments.
- Implement automated security and integration testing.
- Configure database backups and monitoring.
- Apply strict data access policies for children's educational records.
- Review applicable data protection requirements, including India's Digital Personal Data Protection framework.
- Avoid sending personally identifiable student information to external AI services.

---

## 🚀 Future Enhancements

- Offline attendance recording with automatic synchronization.
- SMS notifications for parents without internet access.
- Support for additional regional languages.
- Timetable and homework management.
- Automated report card generation in PDF format.
- Advanced student performance analytics.
- Improved AI-powered personalized learning recommendations.
- Parent-teacher meeting scheduling.
- Automated testing and CI/CD deployment.

---

## 🎯 Project Impact

VidyaSaarthi aims to bring essential school operations into one centralized platform.

By combining student management, attendance tracking, academic monitoring, real-time notifications, and AI-powered learning support, the platform helps schools:

- Improve visibility into student progress.
- Identify students who may need additional academic support.
- Strengthen parent-teacher communication.
- Simplify everyday school administration.
- Make educational assistance more accessible.

---

## 👨‍💻 Author

**Vishal Kumar**

B.Tech – Computer Science and Engineering (AI & ML)

- GitHub: [KumarVishal91](https://github.com/KumarVishal91)
- LinkedIn: [Vishal Kumar](https://www.linkedin.com/in/vishal-kumar91/)

---

## 📄 License

Add your preferred open-source license to the repository before publishing a license claim.

---

<p align="center">
  <b>VidyaSaarthi – Empowering Schools, Supporting Students, Connecting Communities. 🎓</b>
</p>
