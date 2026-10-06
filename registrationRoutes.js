const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.post('/', authenticate, authorizeRole('STUDENT'), registrationController.register);
router.post('/drop', authenticate, authorizeRole('STUDENT'), registrationController.drop);
router.get('/my', authenticate, authorizeRole('STUDENT'), registrationController.getStudentRegistrations);
router.get('/student/:studentId', authenticate, registrationController.getStudentRegistrations);
router.get('/all', authenticate, authorizeRole('ADMIN', 'FACULTY'), registrationController.getAllRegistrations);

module.exports = router;
