require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Expert = require('./models/Expert');
const { seed } = require('./seed');

const expertRoutes = require('./routes/expertRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

// Make io accessible to routes/controllers
app.set('io', io);

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join room for specific expert's detail page
  socket.on('join-expert', (expertId) => {
    socket.join(`expert-${expertId}`);
  });

  socket.on('leave-expert', (expertId) => {
    socket.leave(`expert-${expertId}`);
  });

  // Join consultation video room
  socket.on('join-room', (roomId) => {
    socket.join(`room-${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(`room-${roomId}`);
  });

  // Join a user-specific room for targeted booking status notifications
  socket.on('join-user-room', (email) => {
    if (email && typeof email === 'string') {
      socket.join(`user-${email.toLowerCase().trim()}`);
    }
  });

  socket.on('send-message', ({ roomId, message, sender }) => {
    io.to(`room-${roomId}`).emit('receive-message', {
      sender,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('disconnect', () => {
    // Graceful disconnect
  });
});

// Error handling middleware
app.use(errorHandler);

let memoryServerInstance = null;

// Ensure unique index without duplicates
async function migrateBookingIndexes() {
  try {
    const bookingCollection = mongoose.connection.collection('bookings');
    const indexes = await bookingCollection.indexes();
    const hasOldIndex = indexes.some(idx => idx.name === 'expertId_1_date_1_timeSlot_1');
    if (hasOldIndex) {
      await bookingCollection.dropIndex('expertId_1_date_1_timeSlot_1');
    }
    await Booking.syncIndexes();
  } catch (err) {
    // Indexes synchronized or fresh collection
  }
}

// Ensure database has expert records on startup
async function ensureSeededData() {
  try {
    const count = await Expert.countDocuments();
    if (count === 0) {
      console.log('🌱 No experts found in database, auto-seeding sample dataset...');
      await seed();
    }
  } catch (seedErr) {
    console.error('Auto-seed error:', seedErr.message);
  }
}

// Database Connection with In-Memory fallback
async function startServer() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expert-booking';
  let connected = false;

  console.log(`🔄 Attempting connection to MongoDB at: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('✅ Connected to MongoDB at:', mongoUri);
    connected = true;
  } catch (primaryErr) {
    console.warn(`⚠️ Could not connect to primary MongoDB (${primaryErr.message}).`);
    console.log('🔄 Initializing embedded in-memory MongoDB fallback...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const inMemoryUri = memoryServerInstance.getUri();
      console.log(`✨ Started In-Memory MongoDB at: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('✅ Connected to In-Memory MongoDB instance successfully');
      connected = true;
    } catch (mmsErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', mmsErr.message);
      process.exit(1);
    }
  }

  if (connected) {
    await migrateBookingIndexes();
    await ensureSeededData();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 ExpertConnect Backend running on port ${PORT}`);
      console.log(`📡 WebSocket ready & CORS allowed for: ${allowedOrigins.join(', ')}`);
    });
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
  process.exit(0);
});

startServer();

module.exports = { app, server, io };
