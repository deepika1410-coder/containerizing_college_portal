const resultService = require('../services/resultService');
const { resultUpdates } = require('../metrics/prometheus');
const db = require('../config/database');

async function getStudentResults(req, res, next) {
  try {
    const studentId = req.params.studentId || req.user.studentId;
    const { semester } = req.query;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    let queryText = `
      SELECT r.*, c.code as course_code, c.name as course_name, c.credits,
             d.name as department_name
      FROM results r
      JOIN courses c ON r.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE r.student_id = $1
    `;
    const params = [studentId];

    // If requester is a student, only show published results
    if (req.user.role === 'STUDENT') {
      queryText += ' AND r.is_published = true';
    }

    if (semester) {
      params.push(Number(semester));
      queryText += ` AND r.semester = $${params.length}`;
    }

    queryText += ' ORDER BY r.semester DESC, c.code ASC';

    const result = await db.query(queryText, params);

    // Compute semester GPA
    let totalCredits = 0;
    let earnedPoints = 0;
    result.rows.forEach(row => {
      const cr = Number(row.credits);
      const gp = Number(row.grade_point);
      totalCredits += cr;
      earnedPoints += (cr * gp);
    });

    const semesterGpa = totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : '0.00';

    // Retrieve cumulative CGPA
    const studentRes = await db.query('SELECT cgpa, register_number FROM students WHERE id = $1', [studentId]);
    const cgpa = studentRes.rows[0]?.cgpa || semesterGpa;

    return res.status(200).json({
      success: true,
      semesterGpa: Number(semesterGpa),
      cgpa: Number(cgpa),
      totalCredits,
      results: result.rows
    });
  } catch (err) {
    next(err);
  }
}

async function enterMarks(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await resultService.enterMarks(req.user.id, req.body, ipAddress);
    resultUpdates.inc();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

async function setPublishStatus(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await resultService.setPublishStatus(req.user.id, req.body, ipAddress);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

async function getResultAnalytics(req, res, next) {
  try {
    const distRes = await db.query(`
      SELECT grade, COUNT(*) as count
      FROM results
      WHERE is_published = true AND grade IS NOT NULL
      GROUP BY grade
      ORDER BY count DESC
    `);

    return res.status(200).json({
      success: true,
      gradeDistribution: distRes.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudentResults,
  enterMarks,
  setPublishStatus,
  getResultAnalytics
};
