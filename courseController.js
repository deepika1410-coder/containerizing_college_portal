const db = require('../config/database');

async function getCourses(req, res, next) {
  try {
    const { department, semester, search } = req.query;
    let queryText = `
      SELECT c.*, d.name as department_name, d.code as department_code,
             u.name as faculty_name, f.employee_id as faculty_employee_id
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN faculty f ON c.faculty_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      params.push(department);
      queryText += ` AND (d.code = $${params.length} OR d.id::text = $${params.length})`;
    }
    if (semester) {
      params.push(Number(semester));
      queryText += ` AND c.semester = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (c.code ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY c.semester, c.code`;

    const result = await db.query(queryText, params);
    return res.status(200).json({ success: true, courses: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, d.name as department_name, d.code as department_code,
              u.name as faculty_name
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN faculty f ON c.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    return res.status(200).json({ success: true, course: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createCourse(req, res, next) {
  try {
    const { code, name, department_id, semester, credits, max_seats, faculty_id, deadline, syllabus } = req.body;
    if (!code || !name || !department_id || !semester) {
      return res.status(400).json({ success: false, message: 'Code, name, department, and semester are required.' });
    }

    const result = await db.query(
      `INSERT INTO courses (code, name, department_id, semester, credits, max_seats, faculty_id, deadline, syllabus)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [code, name, department_id, semester, credits || 3, max_seats || 60, faculty_id || null, deadline || null, syllabus || null]
    );

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES ($1, 'COURSE_CREATE', 'COURSE', $2, $3)`,
      [req.user.id, String(result.rows[0].id), JSON.stringify({ code, name })]
    );

    return res.status(201).json({ success: true, message: 'Course created successfully.', course: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { name, credits, max_seats, deadline, syllabus, faculty_id } = req.body;

    const result = await db.query(
      `UPDATE courses 
       SET name = COALESCE($1, name),
           credits = COALESCE($2, credits),
           max_seats = COALESCE($3, max_seats),
           deadline = COALESCE($4, deadline),
           syllabus = COALESCE($5, syllabus),
           faculty_id = COALESCE($6, faculty_id)
       WHERE id = $7 RETURNING *`,
      [name, credits, max_seats, deadline, syllabus, faculty_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES ($1, 'COURSE_UPDATE', 'COURSE', $2, $3)`,
      [req.user.id, String(id), JSON.stringify({ name, max_seats })]
    );

    return res.status(200).json({ success: true, message: 'Course updated successfully.', course: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM courses WHERE id = $1 RETURNING id, code', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES ($1, 'COURSE_DELETE', 'COURSE', $2, $3)`,
      [req.user.id, String(id), JSON.stringify(result.rows[0])]
    );

    return res.status(200).json({ success: true, message: 'Course deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
