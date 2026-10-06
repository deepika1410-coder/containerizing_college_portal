const client = require('prom-client');

// Initialize Prometheus default metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'campusflow_' });

// HTTP Metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'campusflow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

const httpRequestsTotal = new client.Counter({
  name: 'campusflow_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeSocketConnections = new client.Gauge({
  name: 'campusflow_active_socket_connections',
  help: 'Current number of active authenticated WebSocket connections'
});

const databaseConnected = new client.Gauge({
  name: 'campusflow_database_connected',
  help: 'Status of the PostgreSQL database connection (1 = connected, 0 = disconnected)'
});

// Domain Specific Operational Metrics
const courseRegistrationAttempts = new client.Counter({
  name: 'campusflow_course_registration_attempts_total',
  help: 'Total number of course registration attempts',
  labelNames: ['status'] // 'success', 'course_full', 'duplicate', 'error'
});

const attendanceSubmissions = new client.Counter({
  name: 'campusflow_attendance_submissions_total',
  help: 'Total number of student attendance records processed'
});

const resultUpdates = new client.Counter({
  name: 'campusflow_result_updates_total',
  help: 'Total number of exam marks recorded or modified'
});

const notificationsDispatched = new client.Counter({
  name: 'campusflow_notifications_dispatched_total',
  help: 'Total number of notifications delivered through real-time Socket.IO and database',
  labelNames: ['category', 'priority']
});

module.exports = {
  client,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  activeSocketConnections,
  databaseConnected,
  courseRegistrationAttempts,
  attendanceSubmissions,
  resultUpdates,
  notificationsDispatched
};
