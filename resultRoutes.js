const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.get('/my', authenticate, authorizeRole('STUDENT'), resultController.getStudentResults);
router.get('/student/:studentId', authenticate, resultController.getStudentResults);
router.post('/marks', authenticate, authorizeRole('FACULTY', 'ADMIN'), resultController.enterMarks);
router.post('/publish-status', authenticate, authorizeRole('ADMIN'), resultController.setPublishStatus);
router.get('/analytics', authenticate, authorizeRole('ADMIN', 'FACULTY'), resultController.getResultAnalytics);

module.exports = router;
