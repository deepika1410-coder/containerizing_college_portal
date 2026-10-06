const db = require('../config/database');

function calculateGrade(totalMarks) {
  const total = Number(totalMarks);
  if (total >= 90) return { grade: 'O', gradePoint: 10 };
  if (total >= 80) return { grade: 'A+', gradePoint: 9 };
  if (total >= 70) return { grade: 'A', gradePoint: 8 };
  if (total >= 60) return { grade: 'B+', gradePoint: 7 };
  if (total >= 50) return { grade: 'B', gradePoint: 6 };
  return { grade: 'RA', gradePoint: 0 }; // Re-appear / Fail
}

async function updateStudentCGPA(studentId) {
  const res = await db.query(
    `SELECT r.grade_point, c.credits 
     FROM results r
     JOIN courses c ON r.course_id = c.id
     WHERE r.student_id = $1 AND r.is_published = true AND r.grade_point > 0`,
    [studentId]
  );

  if (res.rows.length === 0) return 0.0;

  let totalPoints = 0;
  let totalCredits = 0;
  for (const row of res.rows) {
    totalPoints += Number(row.grade_point) * Number(row.credits);
    totalCredits += Number(row.credits);
  }

  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0.0;
  await db.query('UPDATE students SET cgpa = $1 WHERE id = $2', [cgpa, studentId]);
  return cgpa;
}

async function enterMarks(facultyUserId, { studentId, courseId, semester, internalMarks, externalMarks }, ipAddress = '127.0.0.1') {
  const internal = Number(internalMarks);
  const external = Number(externalMarks);

  if (isNaN(internal) || internal < 0 || internal > 30) {
    throw { status: 400, message: 'Internal marks must be a valid number between 0 and 30.' };
  }
  if (isNaN(external) || external < 0 || external > 70) {
    throw { status: 400, message: 'External marks must be a valid number between 0 and 70.' };
  }

  const total = internal + external;
  const { grade, gradePoint } = calculateGrade(total);

  // Check if existing record is locked
  const existing = await db.query(
    `SELECT id, is_locked, is_published FROM results 
     WHERE student_id = $1 AND course_id = $2 AND semester = $3`,
    [studentId, courseId, semester]
  );

  if (existing.rows.length > 0 && existing.rows[0].is_locked) {
    throw { status: 403, message: 'Results for this subject are locked. Only an Administrator can reopen them.' };
  }

  let resultRecord;
  if (existing.rows.length > 0) {
    const updateRes = await db.query(
      `UPDATE results 
       SET internal_marks = $1, external_marks = $2, total_marks = $3, grade = $4, grade_point = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [internal, external, total, grade, gradePoint, existing.rows[0].id]
    );
    resultRecord = updateRes.rows[0];
  } else {
    const insertRes = await db.query(
      `INSERT INTO results (student_id, course_id, semester, internal_marks, external_marks, total_marks, grade, grade_point, is_published, is_locked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false) RETURNING *`,
      [studentId, courseId, semester, internal, external, total, grade, gradePoint]
    );
    resultRecord = insertRes.rows[0];
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
     VALUES ($1, 'ENTER_MARKS', 'RESULT', $2, $3, $4)`,
    [facultyUserId, String(resultRecord.id), JSON.stringify({ studentId, courseId, total, grade }), ipAddress]
  );

  await updateStudentCGPA(studentId);

  return {
    success: true,
    message: 'Marks recorded successfully and backend grades calculated.',
    result: resultRecord
  };
}

async function setPublishStatus(adminUserId, { courseId, semester, isPublished, isLocked }, ipAddress = '127.0.0.1') {
  const res = await db.query(
    `UPDATE results 
     SET is_published = COALESCE($1, is_published),
         is_locked = COALESCE($2, is_locked)
     WHERE course_id = $3 AND semester = $4
     RETURNING id, student_id`,
    [isPublished, isLocked, courseId, semester]
  );

  // Recalculate CGPA for all affected students
  for (const row of res.rows) {
    await updateStudentCGPA(row.student_id);
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
     VALUES ($1, 'RESULT_STATUS_CHANGE', 'RESULT', $2, $3, $4)`,
    [adminUserId, String(courseId), JSON.stringify({ isPublished, isLocked, affectedRows: res.rowCount }), ipAddress]
  );

  return {
    success: true,
    message: `Updated results for ${res.rowCount} student records. Published: ${isPublished}, Locked: ${isLocked}.`
  };
}

module.exports = {
  calculateGrade,
  updateStudentCGPA,
  enterMarks,
  setPublishStatus
};
