import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { localISO } from './util.js';

const SUBJECTS = ['Maths', 'Science', 'Hindi', 'English', 'Social Sci.'];
const OFFSET = [-4, 0, 6, -2, 2];
const TESTS = [['Unit 1', 60], ['Unit 2', 30], ['Mid-term', 5]]; // [name, days ago]

// [name, base marks, trend per test, last 20 school days of attendance, oldest first]
const ROSTER = [
  ['Aarav Patel', 78, 2, 'PPPPPPPPPPPPPPPPPPPL'],
  ['Diya Kushwaha', 85, 1, 'PPPPPPPPPPPPPPPPPPPP'],
  ['Rohan Singh', 62, -6, 'PPPPPPPPPPPPPAPAAAPA'],
  ['Kavya Tiwari', 90, 0, 'PPPPPPPPPPPPPPPPPPPP'],
  ['Imran Khan', 70, 1, 'PPPPAPPPPPPPPPPPPPPP'],
  ['Pooja Yadav', 55, -4, 'PPPAPPAPPPAAPPAAPAAA'],
  ['Sandeep Gupta', 74, 3, 'PPPPPPPPPLPPPPPPPPPP'],
  ['Anjali Mishra', 81, 1, 'PPPPPPPPPPPPPPPPPAPP'],
  ['Vikram Baiga', 48, -2, 'PPAPPAPPPPPPPAPPPPAP'],
  ['Meera Kol', 66, 2, 'PPPPPPPPPPPPLPPPPPPP'],
  ['Harsh Dwivedi', 88, -1, 'PPPPPPPPPPPPPPPPPPPP'],
  ['Nisha Pandey', 72, -3, 'PPPPPPPPPPPPPPPPPAPA'],
];

function schoolDays(n) {
  const out = [];
  const d = new Date();
  while (out.length < n) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() % 6 !== 0) out.push(localISO(d));
  }
  return out.reverse();
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localISO(d);
}

const hash = await bcrypt.hash('demo1234', 10);
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('TRUNCATE notifications, messages, assessments, attendance, resources, inventory_items, users, students RESTART IDENTITY CASCADE');

  const days = schoolDays(20);
  for (let i = 0; i < ROSTER.length; i++) {
    const [name, base, slope, att] = ROSTER[i];
    const id = i + 1;
    await client.query('INSERT INTO students (admission_no, name, class_name, roll) VALUES ($1, $2, $3, $4)',
      [`VS-24${String(id).padStart(2, '0')}`, name, '8-A', id]);
    for (let d = 0; d < 20; d++) {
      await client.query('INSERT INTO attendance (student_id, date, status) VALUES ($1, $2, $3)', [id, days[d], att[d]]);
    }
    for (let t = 0; t < TESTS.length; t++) {
      for (let s = 0; s < SUBJECTS.length; s++) {
        const noise = ((id * 7 + s * 13 + t * 5) % 7) - 3;
        const score = Math.max(20, Math.min(98, Math.round(base + OFFSET[s] + slope * t + noise)));
        await client.query(
          'INSERT INTO assessments (student_id, subject, test_name, taken_on, score) VALUES ($1, $2, $3, $4, $5)',
          [id, SUBJECTS[s], TESTS[t][0], daysAgo(TESTS[t][1]), score]);
      }
    }
  }

  const users = [
    ['R. K. Verma', 'principal@demo.in', 'admin', null, null],
    ['Sunita Sharma', 'sunita@demo.in', 'teacher', null, '8-A'],
    ['Anil Dubey', 'anil@demo.in', 'teacher', null, '7-A'],
    ['Aarav Patel', 'aarav@demo.in', 'student', 1, null],
    ['Diya Kushwaha', 'diya@demo.in', 'student', 2, null],
    ['Dinesh Singh', 'dinesh@demo.in', 'parent', 3, null],
    ['Sarita Patel', 'sarita@demo.in', 'parent', 1, null],
    ['Mohd. Rafiq Khan', 'rafiq@demo.in', 'parent', 5, null],
  ];
  for (const [name, email, role, studentId, className] of users) {
    await client.query(
      'INSERT INTO users (name, email, password_hash, role, student_id, class_name) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hash, role, studentId, className]);
  }

  const resources = [
    ['Fractions revision worksheet', 'Maths', 'PDF', 'Hindi'],
    ['Photosynthesis explained', 'Science', 'Audio', 'Hindi'],
    ['Sandhi and samas practice', 'Hindi', 'PDF', 'Hindi'],
    ['Reading practice: The Lost Kite', 'English', 'Audio', 'English'],
    ['Rivers of Madhya Pradesh map', 'Social Sci.', 'PDF', 'Hindi'],
    ['Algebra basics, short videos', 'Maths', 'Video', 'Hindi'],
  ];
  for (const r of resources) {
    await client.query('INSERT INTO resources (title, subject, type, language, created_by) VALUES ($1, $2, $3, $4, 2)', r);
  }

  const inventory = [
    ['Class 8 textbooks', 'Books', 38, 40, 'copies'],
    ['Science lab kits', 'Lab', 4, 6, 'kits'],
    ['Desks', 'Furniture', 140, 153, 'desks'],
    ['Mid-day meal rice', 'Meals', 85, 100, 'kg'],
    ['Chalk boxes', 'Stationery', 20, 12, 'boxes'],
    ['Solar study lamps', 'Equipment', 6, 15, 'lamps'],
    ['Tablets for lessons', 'Equipment', 3, 5, 'tablets'],
  ];
  for (const i of inventory) {
    await client.query('INSERT INTO inventory_items (item, category, stock, needed, unit) VALUES ($1, $2, $3, $4, $5)', i);
  }

  await client.query("INSERT INTO messages (student_id, sender_role, sender_id, body) VALUES (3, 'teacher', 2, 'Namaste Mr. Singh, Rohan has missed three days this week. Is everything alright?')");
  await client.query("INSERT INTO messages (student_id, sender_role, sender_id, body) VALUES (3, 'parent', 6, 'He has been unwell. The doctor asked for rest until Monday. I will send a note.')");
  await client.query("INSERT INTO notifications (role, student_id, title, body) VALUES ('parent', 3, 'Rohan was absent', 'Rohan has not attended for three days in a row. Please contact Mrs. Sharma.')");
  await client.query("INSERT INTO notifications (role, student_id, title, body) VALUES ('teacher', 3, 'Early warning', 'Rohan Singh and Pooja Yadav need attention.')");
  await client.query("INSERT INTO notifications (role, title, body) VALUES ('admin', 'Supplies are low', 'Mid-day meal rice: 85 of 100 kg.')");

  await client.query('COMMIT');
  console.log('Sample data loaded. Sign in with principal@demo.in, sunita@demo.in, aarav@demo.in or dinesh@demo.in. Password: demo1234');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
  await pool.end();
}
