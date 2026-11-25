const jwt = require('jsonwebtoken');
const User = require('../models/User');
const eventBus = require('../utils/eventBus');

function configureChat(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId).select('_id username email role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] User connected: ${socket.user.username} (${socket.id})`);

    socket.on('chat:join', (roomName, callback) => {
      const room = typeof roomName === 'string' ? roomName.trim() : '';
      if (!room || room.length > 50) {
        if (typeof callback === 'function') callback({ ok: false, message: 'Room name must be 1-50 characters' });
        return;
      }
      socket.join(room);
      if (typeof callback === 'function') callback({ ok: true, room, message: `Joined room ${room}` });
      io.to(room).emit('chat:system', { message: `${socket.user.username} joined ${room}`, room, at: new Date().toISOString() });
    });

    socket.on('chat:message', (payload, callback) => {
      const room = payload && typeof payload.room === 'string' ? payload.room.trim() : '';
      const message = payload && typeof payload.message === 'string' ? payload.message.trim() : '';
      if (!room || !socket.rooms.has(room)) {
        if (typeof callback === 'function') callback({ ok: false, message: 'Join the room before sending messages' });
        return;
      }
      if (!message || message.length > 1000) {
        if (typeof callback === 'function') callback({ ok: false, message: 'Message must be 1-1000 characters' });
        return;
      }

      const chatMessage = {
        room,
        message,
        sender: { id: socket.user.id, username: socket.user.username },
        at: new Date().toISOString()
      };
      io.to(room).emit('chat:message', chatMessage);
      eventBus.emit('chat:message', { room, username: socket.user.username });
      if (typeof callback === 'function') callback({ ok: true, message: 'Message sent' });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] User disconnected: ${socket.user.username} (${reason})`);
    });
  });
}

module.exports = configureChat;
