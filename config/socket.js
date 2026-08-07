const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room for community updates
    socket.join('community');

    socket.on('join_post', (postId) => {
      if (postId) socket.join(`post:${postId}`);
    });

    socket.on('leave_post', (postId) => {
      if (postId) socket.leave(`post:${postId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.io] Service initialized');
  return io;
};

const getIO = () => {
  return io;
};

/**
 * Broadcasts canonical post interaction state changes ONLY AFTER MongoDB has persisted changes.
 * Socket.io is synchronization layer; MongoDB is source of truth.
 */
const notifyPostUpdated = (postId, data) => {
  if (!io) return;
  io.to('community').emit('post:updated', { postId, ...data });
  io.to(`post:${postId}`).emit('post:updated', { postId, ...data });
};

const notifyModerationAlert = (data) => {
  if (!io) return;
  io.to('admin:moderation').emit('moderation:alert', data);
};

module.exports = {
  initSocket,
  getIO,
  notifyPostUpdated,
  notifyModerationAlert
};
