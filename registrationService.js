const db = require('../config/database');

/**
 * Register course with pessimistic row locking to prevent concurrency race conditions.
 * Only one student can claim the final seat when multiple concurrent requests hit the API.
 */
async function registerCourse(studentId, courseId, semester, ipAddress = '127.0.0.1') {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Verify student exists
    const studentRes = await client.query('SELECT id, user_id, semester FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      throw { status: 404, message: 'Student profile not found.' };
    }
    const student = studentRes.rows[0];

    // 2. Check duplicate registration
    const existingReg = await client.query(
      `SELECT id, status FROM course_registrations 
       WHERE student_id = $1 AND course_id = $2 AND semester = $3`,
      [studentId, courseId, semester]
    );

    if (existingReg.rows.length > 0 && existingReg.rows[0].status === 'REGISTERED') {
      throw { status: 400, message: 'You are already registered for this course.' };
    }

    // 3. Pessimistic Lock on course row: SELECT ... FOR UPDATE
    const courseRes = await client.query(
      `SELECT id, code, name, max_seats, enrolled_count, deadline 
       FROM courses 
       WHERE id = $1 
       FOR UPDATE`,
      [courseId]
    );

    if (courseRes.rows.length === 0) {
      throw { status: 404, message: 'Course not found.' };
    }

    const course = courseRes.rows[0];

    // 4. Validate registration deadline
    if (course.deadline && new Date() > new Date(course.deadline)) {
      throw { status: 400, message: `Registration deadline for ${course.code} has passed.` };
    }

    // 5. Strict atomic capacity update: Guarantees that only ONE transaction can claim the seat
    const atomicSeatRes = await client.query(
      `UPDATE courses 
       SET enrolled_count = enrolled_count + 1 
       WHERE id = $1 AND enrolled_count < max_seats 
       RETURNING enrolled_count, max_seats, code, name`,
      [courseId]
    );

    if (atomicSeatRes.rowCount === 0) {
      throw { status: 409, message: `Course ${course.code} (${course.name}) is currently full. No seats remaining.` };
    }

    const updatedCourse = atomicSeatRes.rows[0];

    // 6. Record registration
    let regId;
    if (existingReg.rows.length > 0 && existingReg.rows[0].status === 'DROPPED') {
      // Re-activate dropped course
      const updateRes = await client.query(
        `UPDATE course_registrations 
         SET status = 'REGISTERED', registered_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING id`,
        [existingReg.rows[0].id]
      );
      regId = updateRes.rows[0].id;
    } else {
      const insertRes = await client.query(
        `INSERT INTO course_registrations (student_id, course_id, semester, status) 
         VALUES ($1, $2, $3, 'REGISTERED') RETURNING id`,
        [studentId, courseId, semester]
      );
      regId = insertRes.rows[0].id;
    }

    // 7. Audit log within the transaction
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address) 
       VALUES ($1, 'COURSE_REGISTER', 'COURSE', $2, $3, $4)`,
      [
        student.user_id,
        String(courseId),
        JSON.stringify({ courseCode: updatedCourse.code, courseName: updatedCourse.name, seatNumber: updatedCourse.enrolled_count }),
        ipAddress
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: `Successfully registered for ${updatedCourse.code} - ${updatedCourse.name}!`,
      registrationId: regId,
      remainingSeats: updatedCourse.max_seats - updatedCourse.enrolled_count
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Drop registered course atomically.
 */
async function dropCourse(studentId, courseId, semester, ipAddress = '127.0.0.1') {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const regRes = await client.query(
      `SELECT cr.id, cr.status, c.id as course_id, c.code, c.name, s.user_id 
       FROM course_registrations cr
       JOIN courses c ON cr.course_id = c.id
       JOIN students s ON cr.student_id = s.id
       WHERE cr.student_id = $1 AND cr.course_id = $2 AND cr.semester = $3 AND cr.status = 'REGISTERED'
       FOR UPDATE`,
      [studentId, courseId, semester]
    );

    if (regRes.rows.length === 0) {
      throw { status: 404, message: 'Active registration record not found for this course.' };
    }

    const record = regRes.rows[0];

    // Update status to DROPPED
    await client.query(
      `UPDATE course_registrations SET status = 'DROPPED' WHERE id = $1`,
      [record.id]
    );

    // Decrement enrolled count
    await client.query(
      `UPDATE courses SET enrolled_count = GREATEST(0, enrolled_count - 1) WHERE id = $1`,
      [record.course_id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address) 
       VALUES ($1, 'COURSE_DROP', 'COURSE', $2, $3, $4)`,
      [record.user_id, String(record.course_id), JSON.stringify({ code: record.code, name: record.name }), ipAddress]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: `Course ${record.code} dropped successfully.`
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  registerCourse,
  dropCourse
};
