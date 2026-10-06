const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'campusflow_jwt_secure_key_928b089b';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function login(email, password, ipAddress = '127.0.0.1') {
  const result = await db.query(
    `SELECT u.*, 
            s.id as student_id, s.register_number, s.department_id as student_dept, s.year, s.semester, s.section, s.cgpa,
            f.id as faculty_id, f.employee_id, f.department_id as faculty_dept, f.designation,
            d.name as department_name, d.code as department_code
     FROM users u
     LEFT JOIN students s ON u.id = s.user_id
     LEFT JOIN faculty f ON u.id = f.user_id
     LEFT JOIN departments d ON d.id = COALESCE(s.department_id, f.department_id)
     WHERE LOWER(u.email) = LOWER($1)`,
    [email]
  );

  if (result.rows.length === 0) {
    await db.query(
      `INSERT INTO audit_logs (action, entity, details, ip_address) 
       VALUES ('LOGIN_FAILED', 'AUTH', $1, $2)`,
      [JSON.stringify({ email, reason: 'User not found' }), ipAddress]
    );
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, details, ip_address) 
       VALUES ($1, 'LOGIN_FAILED', 'AUTH', $2, $3)`,
      [user.id, JSON.stringify({ email, reason: 'Password mismatch' }), ipAddress]
    );
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentId: user.student_id,
    facultyId: user.faculty_id,
    registerNumber: user.register_number,
    departmentId: user.student_dept || user.faculty_dept
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Audit login
  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address) 
     VALUES ($1, 'LOGIN_SUCCESS', 'AUTH', $2, $3, $4)`,
    [user.id, String(user.id), JSON.stringify({ role: user.role, email: user.email }), ipAddress]
  );

  // Exclude password hash from response
  delete user.password_hash;
  return { user, token };
}

async function requestPasswordReset(email) {
  const result = await db.query('SELECT id, email, name FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (result.rows.length === 0) {
    // Return standard message to prevent email enumeration
    return { success: true, message: 'If an account exists with this email, a reset link has been dispatched.' };
  }

  const user = result.rows[0];
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.query(
    `INSERT INTO password_resets (email, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.email, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
  console.log(`\n======================================================`);
  console.log(`[PASSWORD RESET SERVICE] To: ${user.email} (${user.name})`);
  console.log(`[RESET LINK] ${resetUrl}`);
  console.log(`[EXPIRY] 1 Hour (Token Hash: ${tokenHash.slice(0, 10)}...)`);
  console.log(`======================================================\n`);

  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, details) VALUES ($1, 'PASSWORD_RESET_REQUESTED', 'AUTH', $2)`,
    [user.id, JSON.stringify({ email: user.email })]
  );

  return {
    success: true,
    message: 'If an account exists with this email, a reset link has been dispatched.',
    devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
  };
}

async function resetPassword(rawToken, newPassword) {
  if (!rawToken || !newPassword || newPassword.length < 6) {
    throw new Error('Valid token and password (min 6 characters) are required.');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const result = await db.query(
    `SELECT * FROM password_resets 
     WHERE token_hash = $1 AND used = false AND expires_at > CURRENT_TIMESTAMP 
     ORDER BY created_at DESC LIMIT 1`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new Error('Password reset token is invalid, expired, or has already been used.');
  }

  const resetRecord = result.rows[0];
  const newHash = await bcrypt.hash(newPassword, 10);

  // Invalidate token
  await db.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);

  // Update user password
  await db.query('UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)', [newHash, resetRecord.email]);

  await db.query(
    `INSERT INTO audit_logs (action, entity, details) VALUES ('PASSWORD_RESET_COMPLETED', 'AUTH', $1)`,
    [JSON.stringify({ email: resetRecord.email })]
  );

  return { success: true, message: 'Password has been successfully updated. You may now login.' };
}

async function changePassword(userId, oldPassword, newPassword) {
  const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) throw new Error('User not found.');

  const isMatch = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
  if (!isMatch) throw new Error('Current password is incorrect.');

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, details) VALUES ($1, 'PASSWORD_CHANGED', 'AUTH', $2)`,
    [userId, JSON.stringify({ userId })]
  );

  return { success: true, message: 'Password successfully changed.' };
}

module.exports = {
  login,
  requestPasswordReset,
  resetPassword,
  changePassword,
  JWT_SECRET
};
