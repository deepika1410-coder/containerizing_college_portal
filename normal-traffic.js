import http from 'k6/http';
import { check, sleep } from 'k6';

// Scenario 1: Normal steady-state academic traffic
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 users
    { duration: '1m', target: 20 },   // Steady state
    { duration: '15s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.01'],   // Error rate below 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  // 1. Health check probe
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health returns 200': (r) => r.status === 200,
  });

  // 2. Readiness check probe
  const readyRes = http.get(`${BASE_URL}/ready`);
  check(readyRes, {
    'ready returns 200': (r) => r.status === 200,
  });

  // 3. User Login
  const loginPayload = JSON.stringify({
    email: 'student@campusflow.edu',
    password: 'Password123!',
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200 && r.json('token') !== undefined,
  });

  const token = loginRes.json('token');
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // 4. Browse courses & timetable
  const coursesRes = http.get(`${BASE_URL}/api/courses`, authHeaders);
  check(coursesRes, {
    'courses loaded': (r) => r.status === 200,
  });

  const timetableRes = http.get(`${BASE_URL}/api/timetable?semester=5`, authHeaders);
  check(timetableRes, {
    'timetable loaded': (r) => r.status === 200,
  });

  sleep(1);
}
