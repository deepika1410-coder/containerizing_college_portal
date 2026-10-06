const db = require('../config/database');

async function getTimetable(req, res, next) {
  try {
    const { departmentId, semester } = req.query;

    let queryText = `
      SELECT t.*, c.code as course_code, c.name as course_name,
             u.name as faculty_name, d.code as department_code
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      LEFT JOIN faculty f ON t.faculty_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (departmentId) {
      params.push(departmentId);
      queryText += ` AND (d.code = $${params.length} OR t.department_id::text = $${params.length})`;
    }
    if (semester) {
      params.push(Number(semester));
      queryText += ` AND t.semester = $${params.length}`;
    }

    queryText += ` ORDER BY 
      CASE t.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        ELSE 6
      END, t.start_time`;

    const result = await db.query(queryText, params);

    // Group by day of week for responsive schedule rendering
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };

    result.rows.forEach(item => {
      if (scheduleByDay[item.day_of_week]) {
        scheduleByDay[item.day_of_week].push(item);
      }
    });

    return res.status(200).json({
      success: true,
      scheduleByDay,
      rawList: result.rows
    });
  } catch (err) {
    next(err);
  }
}

async function updateTimetable(req, res, next) {
  try {
    const { departmentId, semester, dayOfWeek, startTime, endTime, courseId, facultyId, room } = req.body;

    const result = await db.query(
      `INSERT INTO timetable (department_id, semester, day_of_week, start_time, end_time, course_id, faculty_id, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [departmentId, semester, dayOfWeek, startTime, endTime, courseId, facultyId, room]
    );

    return res.status(201).json({ success: true, entry: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTimetable,
  updateTimetable
};
