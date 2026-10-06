const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.get('/my', authenticate, authorizeRole('STUDENT'), attendanceController.getStudentAttendance);
router.get('/student/:studentId', authenticate, attendanceController.getStudentAttendance);
router.get('/course/:courseId/roster', authenticate, authorizeRole('FACULTY', 'ADMIN'), attendanceController.getCourseRoster);
router.post('/mark', authenticate, authorizeRole('FACULTY', 'ADMIN'), attendanceController.markAttendance);
router.get('/analytics', authenticate, authorizeRole('ADMIN', 'FACULTY'), attendanceController.getAttendanceAnalytics);

module.exports = router;
