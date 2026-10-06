const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.get('/', authenticate, courseController.getCourses);
router.get('/:id', authenticate, courseController.getCourseById);
router.post('/', authenticate, authorizeRole('ADMIN'), courseController.createCourse);
router.put('/:id', authenticate, authorizeRole('ADMIN'), courseController.updateCourse);
router.delete('/:id', authenticate, authorizeRole('ADMIN'), courseController.deleteCourse);

module.exports = router;
