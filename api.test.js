const request = require('supertest');
const { app, server } = require('../src/server');
const db = require('../src/config/database');
const { seedData } = require('../src/db/seed');

let studentToken = '';
let facultyToken = '';
let adminToken = '';
let testStudentId = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await db.initializeDatabase();
  await seedData();

  // Login Student
  const stuRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@campusflow.edu', password: 'Password123!' });
  studentToken = stuRes.body.token;
  testStudentId = stuRes.body.user.student_id;

  // Login Faculty
  const facRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'faculty@campusflow.edu', password: 'Password123!' });
  facultyToken = facRes.body.token;

  // Login Admin
  const admRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@campusflow.edu', password: 'Password123!' });
  adminToken = admRes.body.token;
});

afterAll(async () => {
  if (server && server.close) {
    server.close();
  }
});

describe('1. Health & Observability Probes', () => {
  test('GET /health returns HTTP 200 with service info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('campusflow-backend');
  });

  test('GET /ready verifies PostgreSQL connection', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.database).toBe('CONNECTED');
  });

  test('GET /metrics returns Prometheus metric payload', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('campusflow_http_requests_total');
  });
});

describe('2. Authentication & Security', () => {
  test('Valid login returns JWT and user payload without password_hash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campusflow.edu', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.role).toBe('STUDENT');
  });

  test('Invalid password returns 401 and prevents access', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campusflow.edu', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Forgot password flow dispatches crypto reset token', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'student@campusflow.edu' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devResetUrl).toBeDefined();
  });
});

describe('3. Course Registration & Concurrency Guard', () => {
  test('Student can fetch course list with capacity indicators', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.courses)).toBe(true);
    expect(res.body.courses.length).toBeGreaterThan(0);
  });

  test('Prevent duplicate course registration with 400 error', async () => {
    // Alex is already registered for CS501 in seed data
    const coursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`);
    const cs501 = coursesRes.body.courses.find(c => c.code === 'CS501');

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: cs501.id, semester: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already registered');
  });

  test('Register for available elective course successfully', async () => {
    const coursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`);
    const cs505 = coursesRes.body.courses.find(c => c.code === 'CS505');

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: cs505.id, semester: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('4. Attendance Calculations & Submission', () => {
  test('Student can view calculated subject-wise and overall attendance percentage', async () => {
    const res = await request(app)
      .get('/api/attendance/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.overallPercentage).toBeDefined();
    expect(Array.isArray(res.body.subjects)).toBe(true);
  });

  test('Faculty can mark attendance for class session', async () => {
    const coursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${facultyToken}`);
    const courseId = coursesRes.body.courses[0].id;

    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        courseId,
        date: '2026-10-06',
        hour: 3,
        topic: 'Kubernetes Pod Autoscaling & Rollback Strategies',
        records: [
          { studentId: testStudentId, status: 'PRESENT' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe('5. Results & GPA Calculation Integrity', () => {
  test('Student can view published results with backend-calculated GPA', async () => {
    const res = await request(app)
      .get('/api/results/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.semesterGpa).toBeGreaterThan(0);
    expect(res.body.cgpa).toBeGreaterThan(0);
  });

  test('Reject modification of locked results with 403 Forbidden', async () => {
    const coursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${facultyToken}`);
    const cs501 = coursesRes.body.courses.find(c => c.code === 'CS501');

    // CS501 is marked locked in seed data
    const res = await request(app)
      .post('/api/results/marks')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        studentId: testStudentId,
        courseId: cs501.id,
        semester: 5,
        internalMarks: 29,
        externalMarks: 65
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('locked');
  });
});

describe('6. Real-Time Notifications & Broadcasting', () => {
  test('Student retrieves active notifications and unread badge count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  test('Faculty / Admin can broadcast college announcements', async () => {
    const res = await request(app)
      .post('/api/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Semester End Examination Schedule Published',
        message: 'The schedule has been finalized. Check portal results and timetable modules.',
        category: 'EXAM',
        priority: 'HIGH'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.notification.title).toContain('Semester End');
  });
});

describe('7. RBAC & Security Boundary Enforcement', () => {
  test('Student cannot access admin analytics (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('Student cannot create courses (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: 'HACK101', name: 'Unauthorized Course', department_id: 1, semester: 5 });
    expect(res.status).toBe(403);
  });

  test('Admin has full dashboard and audit log visibility', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats.totalStudents).toBeGreaterThan(0);
    expect(res.body.recentActivity.length).toBeGreaterThan(0);
  });
});
