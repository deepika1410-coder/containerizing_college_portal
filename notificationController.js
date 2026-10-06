const db = require('../config/database');
const { dispatchNotification } = require('../services/socketService');
const { notificationsDispatched } = require('../metrics/prometheus');

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT n.*, u.name as sender_name, u.role as sender_role
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.recipient_id = $1 OR n.recipient_id IS NULL
       ORDER BY n.created_at DESC LIMIT 50`,
      [userId]
    );

    const unreadCountRes = await db.query(
      `SELECT COUNT(*) as unread
       FROM notifications
       WHERE (recipient_id = $1 OR recipient_id IS NULL) AND is_read = false`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: Number(unreadCountRes.rows[0]?.unread || 0),
      notifications: result.rows
    });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    await db.query(
      'UPDATE notifications SET is_read = true WHERE recipient_id = $1 OR recipient_id IS NULL',
      [userId]
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notifications WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
}

async function createNotification(req, res, next) {
  try {
    const senderId = req.user.id;
    const { recipientId, title, message, category, priority } = req.body;

    if (!title || !message || !category) {
      return res.status(400).json({ success: false, message: 'Title, message, and category are required.' });
    }

    const result = await db.query(
      `INSERT INTO notifications (recipient_id, sender_id, title, message, category, priority, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
      [recipientId || null, senderId, title, message, category, priority || 'NORMAL']
    );

    const notification = result.rows[0];

    // Emit real-time WebSocket event
    dispatchNotification(notification);

    // Prometheus metric
    notificationsDispatched.inc({ category: notification.category, priority: notification.priority });

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, 'BROADCAST_NOTIFICATION', 'NOTIFICATION', $2, $3)`,
      [senderId, String(notification.id), JSON.stringify({ title, category, priority })]
    );

    return res.status(201).json({
      success: true,
      message: 'Notification dispatched and stored in database.',
      notification
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
