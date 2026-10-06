const db = require('../config/database');

async function getStudentProfile(req, res, next) {
  try {
    const studentId = req.params.id || req.user.studentId;
    const result = await db.query(
      `SELECT s.*, u.name, u.email, u.phone, u.avatar_url,
              d.name as department_name, d.code as department_code
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    return res.status(200).json({ success: true, student: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateStudentProfile(req, res, next) {
  try {
    const studentId = req.params.id || req.user.studentId;
    const { phone, avatar_url } = req.body;

    // Only allow editing contact/profile fields, not register number or CGPA
    const studentRes = await db.query('SELECT user_id FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const userId = studentRes.rows[0].user_id;
    if (req.user.role === 'STUDENT' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Cannot modify another student profile.' });
    }

    await db.query(
      `UPDATE users 
       SET phone = COALESCE($1, phone),
           avatar_url = COALESCE($2, avatar_url)
       WHERE id = $3`,
      [phone, avatar_url, userId]
    );

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, 'UPDATE_PROFILE', 'USER', $2, $3)`,
      [req.user.id, String(userId), JSON.stringify({ phone, avatar_url })]
    );

    return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getAllStudents(req, res, next) {
  try {
    const { department, search } = req.query;
    let queryText = `
      SELECT s.*, u.name, u.email, u.phone, u.avatar_url,
             d.name as department_name, d.code as department_code
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      params.push(department);
      queryText += ` AND (d.code = $${params.length} OR d.id::text = $${params.length})`;
    }
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (u.name ILIKE $${params.length} OR s.register_number ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY s.register_number`;

    const result = await db.query(queryText, params);
    return res.status(200).json({ success: true, students: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getAllStudents
};
