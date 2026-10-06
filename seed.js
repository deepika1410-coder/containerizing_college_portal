const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seedData() {
  console.log('[Seed] Seeding normalized database data...');
  await db.initializeDatabase();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Clear existing if any
  try {
    await db.query(`
      DELETE FROM audit_logs;
      DELETE FROM notifications;
      DELETE FROM timetable;
      DELETE FROM results;
      DELETE FROM attendance_records;
      DELETE FROM attendance;
      DELETE FROM course_registrations;
      DELETE FROM courses;
      DELETE FROM faculty;
      DELETE FROM students;
      DELETE FROM departments;
      DELETE FROM users;
      DELETE FROM password_resets;
    `);
  } catch (e) {
    // Tables may be empty
  }

  // 1. Departments
  const deptRes = await db.query(`
    INSERT INTO departments (code, name) VALUES
    ('CSE', 'Computer Science & Engineering'),
    ('ECE', 'Electronics & Communication Engineering'),
    ('AIDS', 'Artificial Intelligence & Data Science'),
    ('MECH', 'Mechanical Engineering')
    RETURNING id, code;
  `);
  const depts = {};
  deptRes.rows.forEach(r => { depts[r.code] = r.id; });

  // 2. Users
  const userRes = await db.query(`
    INSERT INTO users (name, email, password_hash, role, phone, avatar_url) VALUES
    ('Dr. Eleanor Vance', 'admin@campusflow.edu', $1, 'ADMIN', '+1-555-0100', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
    ('Prof. Alan Turing', 'faculty@campusflow.edu', $1, 'FACULTY', '+1-555-0101', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    ('Prof. Claude Shannon', 'shannon@campusflow.edu', $1, 'FACULTY', '+1-555-0102', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('Alex Rivera', 'student@campusflow.edu', $1, 'STUDENT', '+1-555-0103', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
    ('Maya Lin', 'maya@campusflow.edu', $1, 'STUDENT', '+1-555-0104', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'),
    ('Rohit Sharma', 'rohit@campusflow.edu', $1, 'STUDENT', '+1-555-0105', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150')
    RETURNING id, email, role;
  `, [passwordHash]);

  const users = {};
  userRes.rows.forEach(u => { users[u.email] = u.id; });

  // 3. Faculty details
  const facRes = await db.query(`
    INSERT INTO faculty (user_id, employee_id, department_id, designation) VALUES
    ($1, 'FAC-1001', $2, 'Associate Professor & Dept Head'),
    ($3, 'FAC-1002', $4, 'Professor & Systems Specialist')
    RETURNING id, employee_id;
  `, [users['faculty@campusflow.edu'], depts['CSE'], users['shannon@campusflow.edu'], depts['ECE']]);

  const facTuring = facRes.rows.find(f => f.employee_id === 'FAC-1001').id;
  const facShannon = facRes.rows.find(f => f.employee_id === 'FAC-1002').id;

  // 4. Students details
  const stuRes = await db.query(`
    INSERT INTO students (user_id, register_number, department_id, year, semester, section, cgpa) VALUES
    ($1, '2024CS101', $2, 3, 5, 'A', 8.85),
    ($3, '2024CS102', $2, 3, 5, 'A', 9.10),
    ($4, '2024EC101', $5, 2, 3, 'B', 7.92)
    RETURNING id, register_number;
  `, [
    users['student@campusflow.edu'], depts['CSE'],
    users['maya@campusflow.edu'],
    users['rohit@campusflow.edu'], depts['ECE']
  ]);

  const stuAlex = stuRes.rows.find(s => s.register_number === '2024CS101').id;
  const stuMaya = stuRes.rows.find(s => s.register_number === '2024CS102').id;
  const stuRohit = stuRes.rows.find(s => s.register_number === '2024EC101').id;

  // 5. Courses
  const futureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const courseRes = await db.query(`
    INSERT INTO courses (code, name, department_id, semester, credits, max_seats, enrolled_count, faculty_id, deadline, syllabus) VALUES
    ('CS501', 'Database Management Systems', $1, 5, 4, 60, 42, $2, $4, 'Relational model, ACID transactions, normalization, PostgreSQL query optimization.'),
    ('CS502', 'Operating Systems & Cloud Architecture', $1, 5, 4, 60, 38, $2, $4, 'Kernel architecture, virtual memory, Docker containers, multi-threading.'),
    ('CS503', 'Computer Networks & Protocols', $1, 5, 3, 60, 40, $3, $4, 'TCP/IP stack, routing protocols, TLS/HTTPS, DNS, socket programming.'),
    ('CS504', 'Full-Stack Web Engineering & DevOps', $1, 5, 3, 50, 48, $2, $4, 'Modern microservices, React, Node.js, CI/CD pipelines, Kubernetes orchestration.'),
    ('CS505', 'Artificial Intelligence & Neural Nets', $1, 5, 4, 45, 44, $2, $4, 'Search heuristics, neural networks, machine learning transformers.'),
    ('CS506', 'High-Concurrency Distributed Systems', $1, 5, 3, 30, 29, $2, $4, 'Raft consensus, atomic distributed locks, horizontal autoscaling.')
    RETURNING id, code;
  `, [depts['CSE'], facTuring, facShannon, futureDeadline]);

  const courses = {};
  courseRes.rows.forEach(c => { courses[c.code] = c.id; });

  // 6. Course Registrations for Alex
  await db.query(`
    INSERT INTO course_registrations (student_id, course_id, semester, status) VALUES
    ($1, $2, 5, 'REGISTERED'),
    ($1, $3, 5, 'REGISTERED'),
    ($1, $4, 5, 'REGISTERED'),
    ($1, $5, 5, 'REGISTERED');
  `, [stuAlex, courses['CS501'], courses['CS502'], courses['CS503'], courses['CS504']]);

  // Maya registered for CS501, CS502, CS506
  await db.query(`
    INSERT INTO course_registrations (student_id, course_id, semester, status) VALUES
    ($1, $2, 5, 'REGISTERED'),
    ($1, $3, 5, 'REGISTERED'),
    ($1, $4, 5, 'REGISTERED');
  `, [stuMaya, courses['CS501'], courses['CS502'], courses['CS506']]);

  // 7. Attendance entries and records
  // CS501: 26 lectures total (Alex: 24 present, 2 absent = 92.3%)
  const attRes1 = await db.query(`
    INSERT INTO attendance (course_id, faculty_id, date, hour, topic) VALUES
    ($1, $2, '2026-09-01', 1, 'Introduction to SQL & PostgreSQL'),
    ($1, $2, '2026-09-03', 2, 'Relational Algebra & Normalization'),
    ($1, $2, '2026-09-05', 1, 'B-Trees and Indexing Internals')
    RETURNING id;
  `, [courses['CS501'], facTuring]);

  await db.query(`
    INSERT INTO attendance_records (attendance_id, student_id, status) VALUES
    ($1, $4, 'PRESENT'),
    ($2, $4, 'PRESENT'),
    ($3, $4, 'ABSENT');
  `, [attRes1.rows[0].id, attRes1.rows[1].id, attRes1.rows[2].id, stuAlex]);

  // 8. Results
  await db.query(`
    INSERT INTO results (student_id, course_id, semester, internal_marks, external_marks, total_marks, grade, grade_point, is_published, is_locked) VALUES
    ($1, $2, 5, 28.0, 62.0, 90.0, 'A+', 9, true, true),
    ($1, $3, 5, 25.0, 59.0, 84.0, 'A', 8, true, true),
    ($1, $4, 5, 24.0, 52.0, 76.0, 'B+', 7, true, false),
    ($1, $5, 5, 29.0, 66.0, 95.0, 'O', 10, false, false);
  `, [stuAlex, courses['CS501'], courses['CS502'], courses['CS503'], courses['CS504']]);

  // 9. Timetable
  await db.query(`
    INSERT INTO timetable (department_id, semester, day_of_week, start_time, end_time, course_id, faculty_id, room) VALUES
    ($1, 5, 'Monday', '09:00', '10:00', $2, $5, 'Hall 301'),
    ($1, 5, 'Monday', '10:15', '11:15', $3, $5, 'Lab 2'),
    ($1, 5, 'Tuesday', '09:00', '10:00', $4, $6, 'Hall 302'),
    ($1, 5, 'Tuesday', '11:30', '12:30', $2, $5, 'Hall 301'),
    ($1, 5, 'Wednesday', '09:00', '10:00', $3, $5, 'Hall 301'),
    ($1, 5, 'Wednesday', '13:30', '14:30', $5, $5, 'DevOps Cloud Lab'),
    ($1, 5, 'Thursday', '10:15', '11:15', $4, $6, 'Hall 302'),
    ($1, 5, 'Friday', '09:00', '10:00', $2, $5, 'Hall 301'),
    ($1, 5, 'Friday', '11:30', '12:30', $5, $5, 'Hall 303');
  `, [depts['CSE'], courses['CS501'], courses['CS502'], courses['CS503'], facTuring, facShannon]);

  // 10. Notifications
  await db.query(`
    INSERT INTO notifications (recipient_id, sender_id, title, message, category, priority, is_read) VALUES
    ($1, $2, 'End-Semester Practical Examination Schedule Released', 'The laboratory examinations for Odd Semester 2026 commence from Oct 20th. Download your timetable schedule.', 'EXAM', 'HIGH', false),
    ($1, $3, 'Course Registration for Odd Semester 2026 Active', 'Enrollment is active. Please complete registration before the deadline. Concurrency locking enabled.', 'REGISTRATION', 'URGENT', false),
    ($1, $4, 'Attendance Advisory: Computer Networks (CS503)', 'Your attendance in Computer Networks is currently 78.3%. Ensure attendance remains above the 75% threshold.', 'ATTENDANCE', 'HIGH', false),
    ($1, $2, 'Semester IV Official Re-evaluation Results Published', 'Re-evaluation results for the previous semester have been finalized and verified by the Academic Board.', 'RESULT', 'NORMAL', true),
    ($1, $2, 'CampusFlow DevOps Hackathon 2026 Announcement', 'Annual 48-hour DevOps & Cloud Hackathon scheduled for next month. Form your team on the portal.', 'COLLEGE', 'NORMAL', false);
  `, [
    users['student@campusflow.edu'],
    users['admin@campusflow.edu'],
    users['faculty@campusflow.edu'],
    users['faculty@campusflow.edu']
  ]);

  // 11. Initial Audit Logs
  await db.query(`
    INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address) VALUES
    ($1, 'SYSTEM_BOOTSTRAP', 'SYSTEM', '1', '{"status": "Database initialized with normalized schema and seed records"}', '127.0.0.1'),
    ($1, 'PUBLISH_COURSE', 'COURSE', 'CS501', '{"code": "CS501", "name": "Database Management Systems", "seats": 60}', '127.0.0.1'),
    ($2, 'UPDATE_MARKS', 'RESULT', 'CS501', '{"student": "2024CS101", "total": 90, "grade": "A+"}', '127.0.0.1');
  `, [users['admin@campusflow.edu'], users['faculty@campusflow.edu']]);

  console.log('[Seed] Database successfully populated with realistic academic records!');
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
