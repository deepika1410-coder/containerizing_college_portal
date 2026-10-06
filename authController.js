const authService = require('../services/authService');
const db = require('../config/database');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await authService.login(email, password, ipAddress);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token: result.token,
      user: result.user
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

async function me(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.created_at,
              s.id as student_id, s.register_number, s.year, s.semester, s.section, s.cgpa,
              f.id as faculty_id, f.employee_id, f.designation,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN faculty f ON u.id = f.user_id
       LEFT JOIN departments d ON d.id = COALESCE(s.department_id, f.department_id)
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const result = await authService.requestPasswordReset(email);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  login,
  me,
  forgotPassword,
  resetPassword,
  changePassword
};
