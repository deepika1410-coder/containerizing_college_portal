const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./authService');

let io = null;
let activeConnectedUsers = 0;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token required for WebSocket connection'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid WebSocket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    activeConnectedUsers++;
    const user = socket.user;
    
    // Join private user room and role-based room
    const userRoom = `user_${user.id}`;
    const roleRoom = `role_${user.role}`;
    socket.join(userRoom);
    socket.join(roleRoom);
    socket.join('broadcast');

    console.log(`[Socket.IO] User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
      activeConnectedUsers = Math.max(0, activeConnectedUsers - 1);
      console.log(`[Socket.IO] User disconnected: ${user.name}`);
    });
  });

  return io;
}

function getIo() {
  return io;
}

function getActiveSocketCount() {
  return activeConnectedUsers;
}

// Real-time dispatching
function dispatchNotification(notification) {
  if (!io) return;

  if (notification.recipient_id) {
    // Deliver to individual recipient
    io.to(`user_${notification.recipient_id}`).emit('notification', notification);
  } else {
    // Deliver to everyone (broadcast)
    io.to('broadcast').emit('notification', notification);
  }
}

module.exports = {
  initSocket,
  getIo,
  getActiveSocketCount,
  dispatchNotification
};
