CREATE TABLE IF NOT EXISTS students (
  id           SERIAL PRIMARY KEY,
  admission_no TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  class_name   TEXT NOT NULL,
  roll         INT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','teacher','parent','admin')),
  student_id    INT REFERENCES students(id),   -- set for student and parent accounts
  class_name    TEXT,                          -- set for teacher accounts
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  notif_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id         SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     CHAR(1) NOT NULL CHECK (status IN ('P','L','A')),
  marked_by  INT REFERENCES users(id),
  UNIQUE (student_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance(date);

CREATE TABLE IF NOT EXISTS assessments (
  id         SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  test_name  TEXT NOT NULL,
  taken_on   DATE NOT NULL,
  score      NUMERIC NOT NULL,
  max_score  NUMERIC NOT NULL DEFAULT 100
);
CREATE INDEX IF NOT EXISTS assessments_student_idx ON assessments(student_id);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher','parent')),
  sender_id   INT NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_student_idx ON messages(student_id, created_at);

CREATE TABLE IF NOT EXISTS resources (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  type       TEXT NOT NULL,
  language   TEXT NOT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id       SERIAL PRIMARY KEY,
  item     TEXT NOT NULL,
  category TEXT NOT NULL,
  stock    INT NOT NULL CHECK (stock >= 0),
  needed   INT NOT NULL CHECK (needed >= 0),
  unit     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  role       TEXT NOT NULL,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_role_idx ON notifications(role, created_at DESC);
