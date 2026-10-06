const db = require('../config/database');
const { attendanceSubmissions } = require('../metrics/prometheus');

async function getStudentAttendance(req, res, next) {
  try {
    const studentId = req.params.studentId || req.user.studentId;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    // Subject-wise percentage query
    const subjectWiseRes = await db.query(
      `SELECT c.id as course_id, c.code as course_code, c.name as course_name,
              COUNT(ar.id) as total_classes,
              COUNT(CASE WHEN ar.status = 'PRESENT' OR ar.status = 'ON_DUTY' THEN 1 END) as attended_classes,
              COUNT(CASE WHEN ar.status = 'ABSENT' THEN 1 END) as absent_classes
       FROM course_registrations cr
       JOIN courses c ON cr.course_id = c.id
       LEFT JOIN attendance a ON a.course_id = c.id
       LEFT JOIN attendance_records ar ON ar.attendance_id = a.id AND ar.student_id = cr.student_id
       WHERE cr.student_id = $1 AND cr.status = 'REGISTERED'
       GROUP BY c.id, c.code, c.name
       ORDER BY c.code`,
      [studentId]
    );

    let totalClassesAll = 0;
    let totalAttendedAll = 0;

    const subjects = subjectWiseRes.rows.map(sub => {
      const total = Number(sub.total_classes);
      const attended = Number(sub.attended_classes);
      const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : '100.0';
      totalClassesAll += total;
      totalAttendedAll += attended;

      return {
        courseId: sub.course_id,
        courseCode: sub.course_code,
        courseName: sub.course_name,
        totalClasses: total,
        attendedClasses: attended,
        absentClasses: Number(sub.absent_classes),
        percentage: Number(percentage),
        isLowAttendance: Number(percentage) < 75.0
      };
    });

    const overallPercentage = totalClassesAll > 0 
      ? Number(((totalAttendedAll / totalClassesAll) * 100).toFixed(1)) 
      : 100.0;

    // Detailed recent history
    const historyRes = await db.query(
      `SELECT a.id, a.date, a.hour, a.topic, ar.status, c.code as course_code, c.name as course_name, u.name as faculty_name
       FROM attendance_records ar
       JOIN attendance a ON ar.attendance_id = a.id
       JOIN courses c ON a.course_id = c.id
       LEFT JOIN faculty f ON a.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE ar.student_id = $1
       ORDER BY a.date DESC, a.hour DESC LIMIT 30`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      overallPercentage,
      totalClasses: totalClassesAll,
      totalAttended: totalAttendedAll,
      subjects,
      history: historyRes.rows
    });
  } catch (err) {
    next(err);
  }
}

async function getCourseRoster(req, res, next) {
  try {
    const { courseId } = req.params;
    const result = await db.query(
      `SELECT s.id as student_id, s.register_number, u.name as student_name, u.email, s.section
       FROM course_registrations cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cr.course_id = $1 AND cr.status = 'REGISTERED'
       ORDER BY s.register_number`,
      [courseId]
    );

    return res.status(200).json({ success: true, students: result.rows });
  } catch (err) {
    next(err);
  }
}

async function markAttendance(req, res, next) {
  const client = await db.getClient();
  try {
    const facultyId = req.user.facultyId;
    const { courseId, date, hour, topic, records } = req.body;

    if (!courseId || !date || !hour || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Course, date, hour, and student records are required.' });
    }

    await client.query('BEGIN');

    // Create attendance entry
    const attRes = await client.query(
      `INSERT INTO attendance (course_id, faculty_id, date, hour, topic)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [courseId, facultyId || null, date, hour, topic || null]
    );
    const attendanceId = attRes.rows[0].id;

    // Insert records
    for (const rec of records) {
      await client.query(
        `INSERT INTO attendance_records (attendance_id, student_id, status, remarks)
         VALUES ($1, $2, $3, $4)`,
        [attendanceId, rec.studentId, rec.status, rec.remarks || null]
      );
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, 'MARK_ATTENDANCE', 'ATTENDANCE', $2, $3)`,
      [req.user.id, String(attendanceId), JSON.stringify({ courseId, count: records.length, date, hour })]
    );

    await client.query('COMMIT');
    attendanceSubmissions.inc(records.length);

    return res.status(201).json({
      success: true,
      message: `Attendance marked successfully for ${records.length} students.`,
      attendanceId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getAttendanceAnalytics(req, res, next) {
  try {
    // Identify low attendance students (< 75%)
    const lowAttRes = await db.query(
      `SELECT s.id as student_id, s.register_number, u.name as student_name,
              c.code as course_code, c.name as course_name,
              COUNT(ar.id) as total_classes,
              COUNT(CASE WHEN ar.status = 'PRESENT' OR ar.status = 'ON_DUTY' THEN 1 END) as attended_classes,
              ROUND((COUNT(CASE WHEN ar.status = 'PRESENT' OR ar.status = 'ON_DUTY' THEN 1 END)::numeric / NULLIF(COUNT(ar.id), 0)) * 100, 1) as percentage
       FROM course_registrations cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN courses c ON cr.course_id = c.id
       JOIN attendance a ON a.course_id = c.id
       JOIN attendance_records ar ON ar.attendance_id = a.id AND ar.student_id = s.id
       WHERE cr.status = 'REGISTERED'
       GROUP BY s.id, s.register_number, u.name, c.code, c.name
       HAVING COUNT(ar.id) > 0 AND (COUNT(CASE WHEN ar.status = 'PRESENT' OR ar.status = 'ON_DUTY' THEN 1 END)::numeric / COUNT(ar.id)) < 0.75
       ORDER BY percentage ASC LIMIT 50`
    );

    return res.status(200).json({ success: true, lowAttendanceStudents: lowAttRes.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudentAttendance,
  getCourseRoster,
  markAttendance,
  getAttendanceAnalytics
};
