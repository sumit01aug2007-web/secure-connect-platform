const EventEmitter = require('events');

class AppEventBus extends EventEmitter {}
const eventBus = new AppEventBus();

eventBus.on('user:registered', ({ userId, email }) => {
  console.log(`[event] user:registered | userId=${userId} | email=${email}`);
});
eventBus.on('user:login', ({ userId }) => {
  console.log(`[event] user:login | userId=${userId}`);
});
eventBus.on('note:created', ({ noteId, userId }) => {
  console.log(`[event] note:created | noteId=${noteId} | userId=${userId}`);
});
eventBus.on('note:updated', ({ noteId, userId }) => {
  console.log(`[event] note:updated | noteId=${noteId} | userId=${userId}`);
});
eventBus.on('note:deleted', ({ noteId, userId }) => {
  console.log(`[event] note:deleted | noteId=${noteId} | userId=${userId}`);
});
eventBus.on('chat:message', ({ room, username }) => {
  console.log(`[event] chat:message | room=${room} | from=${username}`);
});

module.exports = eventBus;
