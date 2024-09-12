const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const admin = require('firebase-admin');
const knex = require('../server/src/config/db');
require('dotenv').config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./src/config/nextstream-firebaseServiceAccountKey.json')),
  });
}

const emailRoutes = require('./src/routes/emailRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profileRoutes');
const tmdbRoutes = require('./src/routes/tmdbRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const interactionRoutes = require('./src/routes/interactionRoutes');
const cronJobs = require('./src/services/cronJobs');
const favesRoutes = require('./src/routes/favesRoutes');
const recommendationsRoutes = require('./src/routes/recommendationsRoutes');
const mediaStatusRoutes = require('./src/routes/mediaStatusRoutes');
const spotlightRoutes = require('./src/routes/spotlightRoutes');
const eventDownloadRoutes = require('./src/routes/eventDownloadRoutes');
const friendsRoutes = require('./src/routes/friendsRoutes');
const friendsMsgsRoutes = require('./src/routes/friendsMsgsRoutes');
const userRoutes = require('./src/routes/userRoutes');

const authenticate = require('./src/middleware/authenticate');
const guestAuthenticate = require('./src/middleware/guestAuthenticate');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Use session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

// Initialize NodeCache with TTL of 1 hour
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

// Serve uploaded avatars
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Socket.IO Setup
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Typing events for friends chat
  socket.on('typing', (data) => {
    socket.to(data.friendId).emit('typing', { friendId: data.userId });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.friendId).emit('stop_typing', { friendId: data.userId });
  });

  // Join the user to their own room based on their userId
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User with socket ID: ${socket.id} joined room: ${roomId}`);
  });

  // Listen for the send_message event
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message } = data;

    try {
      // Insert the message into the database
      const savedMessage = await knex('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message,
        is_read: false,
        created_at: knex.fn.now(),
      });

      // Emit the message to the recipient's room
      io.to(receiverId).emit('receive_message', {
        senderId,
        receiverId,
        message,
        created_at: new Date(),
      });

      console.log('Message saved and sent:', savedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error_message', { message: 'Error sending message. Please try again.' });
    }
  });

  // Listen for new calendar invites
  socket.on('new_calendar_invite', async (data) => {
    const { invitedUserId, inviteDetails } = data;
    try {
      io.to(invitedUserId).emit('receive_calendar_invite', inviteDetails);
      console.log('New calendar invite sent:', inviteDetails);
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      socket.emit('error_calendar_invite', { message: 'Error sending calendar invite.' });
    }
  });

  // Listen for calendar invite responses
  socket.on('respond_calendar_invite', async (data) => {
    const { inviteId, userId, response } = data;
    try {
      await respondToSharedEvent(userId, inviteId, response);
      io.to(userId).emit('calendar_invite_responded', { inviteId, response });
    } catch (error) {
      console.error('Error responding to calendar invite:', error);
      socket.emit('error_calendar_response', { message: 'Error responding to invite.' });
    }
  });

  // Listen for new friend requests
  socket.on('new_friend_request', async (data) => {
    const { requestedUserId, requestDetails } = data;
    try {
      io.to(requestedUserId).emit('receive_friend_request', requestDetails);
      console.log('New friend request sent:', requestDetails);
    } catch (error) {
      console.error('Error sending friend request:', error);
      socket.emit('error_friend_request', { message: 'Error sending friend request.' });
    }
  });

  // Listen for friend request acceptance
  socket.on('friend_request_accepted', async (data) => {
    const { senderUserId, friendDetails } = data;
    try {
      io.to(senderUserId).emit('friend_request_accepted', friendDetails);
      console.log('Friend request accepted:', friendDetails);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      socket.emit('error_friend_acceptance', { message: 'Error accepting friend request.' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start scheduled jobs
cronJobs.scheduleJobs();

// API Routes
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/external-cal', eventDownloadRoutes);

// Spotlight Routes for person details
app.use('/api/spotlight', authenticate, spotlightRoutes);

// Calendar Routes (Allow both authenticated users and guests)
app.use('/api/calendar', (req, res, next) => {
  const token = req.cookies.token || req.cookies.guestToken;

  if (token) {
    if (req.cookies.token) {
      authenticate(req, res, next);
    } else if (req.cookies.guestToken) {
      guestAuthenticate(req, res, next);
    }
  } else {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
}, calendarRoutes);

app.use('/api/interactions', interactionRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);
app.use('/api/faves', authenticate, favesRoutes);
app.use('/api/media-status', authenticate, mediaStatusRoutes);

// Friends API Routes
app.use('/api/friends', authenticate, friendsRoutes);
app.use('/api/messages', authenticate, friendsMsgsRoutes);
app.use('/api/users', authenticate, userRoutes);

// Serve static files from the React app if needed
app.use(express.static(path.join(__dirname, 'client/build')));

// Serve React app for specific routes
const allowedRoutes = ['/', '/terms'];
app.get(allowedRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Wait! Something broke!');
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});