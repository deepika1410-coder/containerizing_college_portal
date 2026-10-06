import http from 'k6/http';
import { check, sleep } from 'k6';

// Scenario 2: High-concurrency course registration opening spike
// Hundreds of students hit registration endpoints at the stroke of 9:00 AM
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Flash spike to 50 concurrent students
    { duration: '30s', target: 150 },  // Surge to 150 concurrent students
    { duration: '20s', target: 50 },   // Gradual wind-down
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% within 800ms during severe peak spike
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'student@campusflow.edu',
    password: 'Password123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('token');
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // Concurrently attempt course registration
  // Course ID 5 or 6 (limited quota)
  const regPayload = JSON.stringify({
    courseId: 5,
    semester: 5,
  });

  const regRes = http.post(`${BASE_URL}/api/registrations`, regPayload, authHeaders);

  // Either 200 (registered) or 409 (course full) or 400 (already registered)
  // None of these should result in 500 internal server error
  check(regRes, {
    'handled gracefully without 500 error': (r) => [200, 400, 409].includes(r.status),
  });

  sleep(0.5);
}
