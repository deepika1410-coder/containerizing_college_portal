const registrationService = require('../services/registrationService');
const { courseRegistrationAttempts } = require('../metrics/prometheus');
const db = require('../config/database');

async function register(req, res, next) {
  try {
    const studentId = req.user.studentId;
    const { courseId, semester } = req.body;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can register for courses.' });
    }
    if (!courseId || !semester) {
      return res.status(400).json({ success: false, message: 'Course ID and semester are required.' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await registrationService.registerCourse(studentId, courseId, semester, ipAddress);

    courseRegistrationAttempts.inc({ status: 'success' });
    return res.status(200).json(result);
  } catch (err) {
    if (err.status === 409) {
      courseRegistrationAttempts.inc({ status: 'course_full' });
    } else if (err.status === 400 && err.message.includes('already registered')) {
      courseRegistrationAttempts.inc({ status: 'duplicate' });
    } else {
      courseRegistrationAttempts.inc({ status: 'error' });
    }
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

async function drop(req, res, next) {
  try {
    const studentId = req.user.studentId;
    const { courseId, semester } = req.body;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only enrolled students can drop courses.' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await registrationService.dropCourse(studentId, courseId, semester, ipAddress);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

async function getStudentRegistrations(req, res, next) {
  try {
    const studentId = req.params.studentId || req.user.studentId;
    const result = await db.query(
      `SELECT cr.id, cr.semester, cr.registered_at, cr.status,
              c.id as course_id, c.code as course_code, c.name as course_name, c.credits,
              d.name as department_name, u.name as faculty_name
       FROM course_registrations cr
       JOIN courses c ON cr.course_id = c.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN faculty f ON c.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE cr.student_id = $1 AND cr.status = 'REGISTERED'
       ORDER BY c.code`,
      [studentId]
    );

    return res.status(200).json({ success: true, registrations: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getAllRegistrations(req, res, next) {
  try {
    const result = await db.query(
      `SELECT cr.*, 
              s.register_number, u_stu.name as student_name,
              c.code as course_code, c.name as course_name, c.credits,
              d.name as department_name
       FROM course_registrations cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u_stu ON s.user_id = u_stu.id
       JOIN courses c ON cr.course_id = c.id
       LEFT JOIN departments d ON c.department_id = d.id
       ORDER BY cr.registered_at DESC LIMIT 100`
    );

    return res.status(200).json({ success: true, registrations: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  drop,
  getStudentRegistrations,
  getAllRegistrations
};
