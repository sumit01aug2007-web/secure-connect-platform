require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const configureChat = require('./socket/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] }
});

app.use(express.json({ limit: '20kb' }));
app.use(express.static('public'));
app.get('/', (req, res) => res.status(200).json({ message: 'Secure Connect API is running' }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', service: 'secure-connect-platform' }));
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  console.error('[server error]', error.message);
  res.status(500).json({ message: 'Internal server error' });
});

configureChat(io);

const PORT = Number(process.env.PORT) || 5000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`[server] Listening on http://localhost:${PORT}`)))
  .catch((error) => {
    console.error(`[database] Connection failed: ${error.message}`);
    process.exit(1);
  });

module.exports = { app, server, io };
