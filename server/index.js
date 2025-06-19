require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const GameSocket = require('./src/socket/gameSocket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  }
});

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);

// Initialize game socket
const gameSocket = new GameSocket(io);
gameSocket.initialize();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    ...gameSocket.getGameStats()
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});