const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

router.get('/', authenticate, timetableController.getTimetable);
router.post('/', authenticate, authorizeRole('ADMIN', 'FACULTY'), timetableController.updateTimetable);

module.exports = router;
