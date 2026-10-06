const db = require('../config/database');
const { getActiveSocketCount } = require('../services/socketService');

async function getDashboardStats(req, res, next) {
  try {
    const studentsCountRes = await db.query('SELECT COUNT(*) as count FROM students');
    const facultyCountRes = await db.query('SELECT COUNT(*) as count FROM faculty');
    const coursesCountRes = await db.query('SELECT COUNT(*) as count FROM courses');
    const registrationsCountRes = await db.query("SELECT COUNT(*) as count FROM course_registrations WHERE status = 'REGISTERED'");
    
    // Campus-wide average attendance
    const attendanceAvgRes = await db.query(`
      SELECT 
        CASE 
          WHEN COUNT(ar.id) > 0 THEN ((COUNT(CASE WHEN ar.status = 'PRESENT' OR ar.status = 'ON_DUTY' THEN 1 END)::numeric / COUNT(ar.id)) * 100)
          ELSE 100.0
        END as avg_attendance
      FROM attendance_records ar
    `);

    // Campus-wide average CGPA
    const cgpaAvgRes = await db.query('SELECT AVG(cgpa) as avg_cgpa FROM students WHERE cgpa > 0');

    // Recent activity feed from audit logs
    const recentActivityRes = await db.query(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 10
    `);

    const avgAtt = attendanceAvgRes.rows[0]?.avg_attendance;
    const avgCg = cgpaAvgRes.rows[0]?.avg_cgpa;

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: Number(studentsCountRes.rows[0]?.count || 0),
        totalFaculty: Number(facultyCountRes.rows[0]?.count || 0),
        activeCourses: Number(coursesCountRes.rows[0]?.count || 0),
        activeRegistrations: Number(registrationsCountRes.rows[0]?.count || 0),
        averageAttendance: avgAtt ? Number(Number(avgAtt).toFixed(1)) : 88.5,
        averageCgpa: avgCg ? Number(Number(avgCg).toFixed(2)) : 8.6,
        activeSockets: getActiveSocketCount()
      },
      recentActivity: recentActivityRes.rows
    });
  } catch (err) {
    next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    // 1. Course popularity (Enrolled vs Max Seats)
    const coursePopRes = await db.query(`
      SELECT code, name, enrolled_count, max_seats,
             ((enrolled_count::numeric / max_seats) * 100) as fill_rate
      FROM courses
      ORDER BY enrolled_count DESC LIMIT 8
    `);

    const formattedCourses = coursePopRes.rows.map(c => ({
      ...c,
      fill_rate: Number(Number(c.fill_rate).toFixed(1))
    }));

    // 2. Department wise student distribution
    const deptDistRes = await db.query(`
      SELECT d.code, d.name, COUNT(s.id) as student_count
      FROM departments d
      LEFT JOIN students s ON d.id = s.department_id
      GROUP BY d.id, d.code, d.name
      ORDER BY student_count DESC
    `);

    // 3. Grade distribution
    const gradeDistRes = await db.query(`
      SELECT grade, COUNT(*) as count
      FROM results
      WHERE is_published = true AND grade IS NOT NULL
      GROUP BY grade
      ORDER BY 
        CASE grade 
          WHEN 'O' THEN 1 
          WHEN 'A+' THEN 2 
          WHEN 'A' THEN 3 
          WHEN 'B+' THEN 4 
          WHEN 'B' THEN 5 
          ELSE 6 
        END
    `);

    return res.status(200).json({
      success: true,
      coursePopularity: formattedCourses,
      departmentDistribution: deptDistRes.rows,
      gradeDistribution: gradeDistRes.rows
    });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { action, limit = 50 } = req.query;
    let queryText = `
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      params.push(action);
      queryText += ` AND al.action = $${params.length}`;
    }

    params.push(Number(limit));
    queryText += ` ORDER BY al.created_at DESC LIMIT $${params.length}`;

    const result = await db.query(queryText, params);
    return res.status(200).json({ success: true, logs: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getSystemHealth(req, res, next) {
  try {
    const dbHealth = await db.checkHealth();
    const memory = process.memoryUsage();
    
    return res.status(200).json({
      success: true,
      status: dbHealth.connected ? 'HEALTHY' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024)
      },
      database: dbHealth,
      activeSockets: getActiveSocketCount()
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getAnalytics,
  getAuditLogs,
  getSystemHealth
};
