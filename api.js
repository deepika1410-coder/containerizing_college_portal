const BASE_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('campusflow_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Network request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  changePassword: (oldPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),

  // Courses
  getCourses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/courses${query ? `?${query}` : ''}`);
  },
  getCourseById: (id) => request(`/courses/${id}`),
  createCourse: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),

  // Registrations
  registerCourse: (courseId, semester) => request('/registrations', { method: 'POST', body: JSON.stringify({ courseId, semester }) }),
  dropCourse: (courseId, semester) => request('/registrations/drop', { method: 'POST', body: JSON.stringify({ courseId, semester }) }),
  getMyRegistrations: () => request('/registrations/my'),
  getAllRegistrations: () => request('/registrations/all'),

  // Attendance
  getMyAttendance: () => request('/attendance/my'),
  getStudentAttendance: (studentId) => request(`/attendance/student/${studentId}`),
  getCourseRoster: (courseId) => request(`/attendance/course/${courseId}/roster`),
  markAttendance: (data) => request('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
  getAttendanceAnalytics: () => request('/attendance/analytics'),

  // Results
  getMyResults: (semester) => request(`/results/my${semester ? `?semester=${semester}` : ''}`),
  getStudentResults: (studentId, semester) => request(`/results/student/${studentId}${semester ? `?semester=${semester}` : ''}`),
  enterMarks: (data) => request('/results/marks', { method: 'POST', body: JSON.stringify(data) }),
  setPublishStatus: (data) => request('/results/publish-status', { method: 'POST', body: JSON.stringify(data) }),
  getResultAnalytics: () => request('/results/analytics'),

  // Notifications
  getMyNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  broadcastNotification: (data) => request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),

  // Timetable
  getTimetable: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/timetable${query ? `?${query}` : ''}`);
  },

  // Student directory & profile
  getProfile: () => request('/students/profile'),
  updateProfile: (data) => request('/students/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getAllStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ''}`);
  },

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminAnalytics: () => request('/admin/analytics'),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },
  getSystemHealth: () => request('/admin/health')
};
