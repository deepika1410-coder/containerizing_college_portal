import http from 'k6/http';
import { check, sleep } from 'k6';

// Scenario 3: Exam Results Release Surge
// High-read surge when university controller of examinations publishes final grades
export const options = {
  stages: [
    { duration: '15s', target: 50 },
    { duration: '45s', target: 200 }, // Heavy read spike
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // Fast read SLA
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
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

  // Fetch results and GPA calculations
  const resultsRes = http.get(`${BASE_URL}/api/results/my?semester=5`, authHeaders);
  check(resultsRes, {
    'results fetched': (r) => r.status === 200,
    'semester GPA present': (r) => r.json('semesterGpa') !== undefined,
    'CGPA present': (r) => r.json('cgpa') !== undefined,
  });

  sleep(0.5);
}
