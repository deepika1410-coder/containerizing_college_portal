const request = require('supertest');
const { app, server } = require('../src/server');
const db = require('../src/config/database');
const { seedData } = require('../src/db/seed');

let mayaToken = '';
let rohitToken = '';
let cs506Id = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await db.initializeDatabase();
  await seedData();

  // Student 2 (Maya) - enrolled in other courses, but let's test Student 3 (Rohit) and new students
  const mayaRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maya@campusflow.edu', password: 'Password123!' });
  mayaToken = mayaRes.body.token;

  const rohitRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'rohit@campusflow.edu', password: 'Password123!' });
  rohitToken = rohitRes.body.token;

  // Let's create two test students specifically for the race test on CS506
  // CS506 has max_seats: 30, enrolled_count: 29. Exactly 1 seat left!
  const coursesRes = await request(app)
    .get('/api/courses')
    .set('Authorization', `Bearer ${rohitToken}`);
  const cs506 = coursesRes.body.courses.find(c => c.code === 'CS506');
  cs506Id = cs506.id;
});

afterAll(async () => {
  if (server && server.close) {
    server.close();
  }
});

describe('Course Registration Concurrency & Atomic Capacity Race Condition', () => {
  test('CS506 has exactly 1 seat remaining (enrolled: 29, max: 30)', async () => {
    const res = await request(app)
      .get(`/api/courses/${cs506Id}`)
      .set('Authorization', `Bearer ${rohitToken}`);
    expect(res.body.course.max_seats - res.body.course.enrolled_count).toBe(1);
  });

  test('Concurrent registration: Exactly ONE student gets the final seat, the other receives 409 Conflict', async () => {
    // Rohit attempts to register for CS506
    // Note: Maya already registered for CS506 in seed data, so let's register Rohit (who is not registered)
    // To test race between two un-enrolled students, let's create a temporary 4th student:
    const client = await db.getClient();
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES ('Test Race Student', 'race@campusflow.edu', 'hash', 'STUDENT');
      INSERT INTO students (user_id, register_number, department_id, year, semester, section) 
      VALUES ((SELECT id FROM users WHERE email='race@campusflow.edu'), '2024CS999', (SELECT id FROM departments WHERE code='CSE'), 3, 5, 'A');
    `);
    client.release();

    const raceRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'race@campusflow.edu', password: 'Password123!' })
      .catch(() => null); // password hash dummy, so let's issue token directly

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../src/services/authService');
    const raceStudentQuery = await db.query("SELECT s.id, u.id as user_id FROM students s JOIN users u ON s.user_id=u.id WHERE u.email='race@campusflow.edu'");
    const raceToken = jwt.sign({
      id: raceStudentQuery.rows[0].user_id,
      role: 'STUDENT',
      studentId: raceStudentQuery.rows[0].id
    }, JWT_SECRET);

    // Fire both registration requests simultaneously using Promise.all
    const [req1, req2] = await Promise.all([
      request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${rohitToken}`)
        .send({ courseId: cs506Id, semester: 5 }),
      request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${raceToken}`)
        .send({ courseId: cs506Id, semester: 5 })
    ]);

    const statuses = [req1.status, req2.status].sort();
    
    // Exactly one must succeed (200) and one must be rejected with 409 (full)
    expect(statuses).toEqual([200, 409]);

    const failedReq = req1.status === 409 ? req1 : req2;
    expect(failedReq.body.message).toContain('currently full');

    // Confirm course is now 30/30
    const finalCourseRes = await request(app)
      .get(`/api/courses/${cs506Id}`)
      .set('Authorization', `Bearer ${rohitToken}`);
    expect(finalCourseRes.body.course.enrolled_count).toBe(30);
  });
});
