const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.get('/profile', authenticate, studentController.getStudentProfile);
router.get('/profile/:id', authenticate, studentController.getStudentProfile);
router.put('/profile', authenticate, studentController.updateStudentProfile);
router.put('/profile/:id', authenticate, studentController.updateStudentProfile);
router.get('/', authenticate, authorizeRole('FACULTY', 'ADMIN'), studentController.getAllStudents);

module.exports = router;
