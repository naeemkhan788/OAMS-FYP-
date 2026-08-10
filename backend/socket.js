const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO server
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Store connected users with their userId
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // User joins their personal room
    socket.on('user:join', (userId) => {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      connectedUsers.set(userId, socket.id);
      console.log(`[SOCKET] User ${userId} joined their room`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`[SOCKET] User ${socket.userId} disconnected`);
      }
    });

    // Handle reconnection
    socket.on('reconnect', () => {
      console.log(`[SOCKET] User reconnected: ${socket.id}`);
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        connectedUsers.set(socket.userId, socket.id);
      }
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Emit notification to a specific user
 */
const emitNotification = (userId, notification) => {
  if (!io) {
    console.warn('[SOCKET] Socket.IO not initialized, notification not sent');
    return;
  }
  
  io.to(`user:${userId}`).emit('notification:new', notification);
  console.log(`[SOCKET] Notification sent to user ${userId}`);
};

/**
 * Emit unread count update to a specific user
 */
const emitUnreadCount = (userId, count) => {
  if (!io) {
    console.warn('[SOCKET] Socket.IO not initialized, count not sent');
    return;
  }
  
  io.to(`user:${userId}`).emit('notification:unread-count', { count });
  console.log(`[SOCKET] Unread count sent to user ${userId}: ${count}`);
};

/**
 * Emit unread counts by page to a specific user
 */
const emitUnreadCountsByPage = (userId, counts) => {
  if (!io) {
    console.warn('[SOCKET] Socket.IO not initialized, counts not sent');
    return;
  }
  
  io.to(`user:${userId}`).emit('notification:unread-counts', { counts });
  console.log(`[SOCKET] Unread counts by page sent to user ${userId}`);
};

module.exports = {
  initializeSocket,
  getIO,
  emitNotification,
  emitUnreadCount,
  emitUnreadCountsByPage
};
