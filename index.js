const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const courseRoutes = require('./courseRoutes');
const registrationRoutes = require('./registrationRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const resultRoutes = require('./resultRoutes');
const notificationRoutes = require('./notificationRoutes');
const timetableRoutes = require('./timetableRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/registrations', registrationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/results', resultRoutes);
router.use('/notifications', notificationRoutes);
router.use('/timetable', timetableRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
