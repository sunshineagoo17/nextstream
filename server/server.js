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
const fs = require('fs');
require('dotenv').config();

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    }),
  });
}

// Import routes
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
const unsubscribeRoutes = require('./src/routes/unsubscribeRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const trainRoutes = require('./src/routes/trainRoutes');
const gptRoutes = require('./src/routes/gptRoutes');

// Middleware
const authenticate = require('./src/middleware/authenticate');
const guestAuthenticate = require('./src/middleware/guestAuthenticate');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
module.exports = { server, io };

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Use session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None', 
    },
  })
);

// Configure CORS with better environment detection
const allowedOrigins = [process.env.CLIENT_URL];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Initialize NodeCache with TTL of 1 hour
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Socket.IO Setup
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId; 

  if (userId) {
    socket.join(userId); 
    console.log(`User ${userId} connected and joined room ${userId}`);
  } else {
    console.warn(`No userId provided for socket ${socket.id}`);
  }

  // Logging to track listener setup and rooms joined
  const logListeners = () => {
    console.log(`Listeners count for socket ${socket.id}:`);
    console.log(`typing: ${socket.listenerCount('typing')}`);
    console.log(`stop_typing: ${socket.listenerCount('stop_typing')}`);
    console.log(`send_message: ${socket.listenerCount('send_message')}`);
  };

  logListeners(); 

  // Typing events for friends chat
  socket.on('typing', (data) => {
    socket.to(data.friendId).emit('typing', { friendId: data.userId });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.friendId).emit('stop_typing', { friendId: data.userId });
  });

  socket.on('join_room', (roomId) => {
    if (!socket.rooms.has(roomId)) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    }
  });

  // Message sending event
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message } = data;

    try {
        await knex.transaction(async (trx) => {
            const [savedMessage] = await trx('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
                    message,
                    is_read: false,
                    created_at: trx.fn.now(),
                })
                .returning(['id', 'sender_id', 'receiver_id', 'message', 'created_at']);

            if (savedMessage) {
                io.to(receiverId).emit('receive_message', savedMessage);
            }
        });
    } catch (error) {
        console.error('Error inserting message:', error);

        socket.emit('error_message', {
            message: 'Error sending message. Please try again.',
        });
    }
  });

  // Listen for new calendar invites
  socket.on('new_calendar_invite', async (data) => {
    const { invitedUserId, inviteDetails } = data;
    try {
      io.to(invitedUserId).emit('receive_calendar_invite', inviteDetails);
    } catch (error) {
      socket.emit('error_calendar_invite', {
        message: 'Error sending calendar invite.',
      });
    }
  });

  // Listen for calendar invite responses
  socket.on('respond_calendar_invite', async (data) => {
    const { inviteId, userId, response } = data;
    try {
      await respondToSharedEvent(userId, inviteId, response);

      if (response === 'accepted') {
        const acceptedInvite = await getInviteDetails(inviteId);
        io.to(userId).emit('calendar_event_updated', { event: acceptedInvite });
      } else {
        io.to(userId).emit('calendar_event_removed', { inviteId });
      }

      io.to(userId).emit('calendar_invite_responded', { inviteId, response });
    } catch (error) {
      socket.emit('error_calendar_response', {
        message: 'Error responding to invite.',
      });
    }
  });

  // Listen for new friend requests
  socket.on('new_friend_request', async (data) => {
    const { requestedUserId, requestDetails } = data;
    try {
      io.to(requestedUserId).emit('receive_friend_request', requestDetails);
    } catch (error) {
      socket.emit('error_friend_request', {
        message: 'Error sending friend request.',
      });
    }
  });

  // Listen for friend request acceptance
  socket.on('friend_request_accepted', async (data) => {
    const { senderUserId, friendDetails } = data;
    try {
      io.to(senderUserId).emit('friend_request_accepted', friendDetails);
    } catch (error) {
      socket.emit('error_friend_acceptance', {
        message: 'Error accepting friend request.',
      });
    }
  });

  // Listen for calendar event notifications
  socket.on('calendar_event_notification', (data) => {
    const { userId, message, eventId } = data;
    io.to(userId).emit('calendar_event_notification', { message, eventId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    socket.removeAllListeners(); 
  });

  logListeners();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/unsubscribe', unsubscribeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/external-cal', eventDownloadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/train', authenticate, trainRoutes);
app.use('/api/gpt', gptRoutes);

// Spotlight Routes for person details
app.use('/api/spotlight', authenticate, spotlightRoutes);

// Calendar Routes (Allow both authenticated users and guests)
app.use(
  '/api/calendar',
  (req, res, next) => {
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
  },
  calendarRoutes
);

app.use('/api/interactions', interactionRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);
app.use('/api/faves', authenticate, favesRoutes);
app.use('/api/media-status', authenticate, mediaStatusRoutes);

// Friends API Routes
app.use('/api/friends', authenticate, friendsRoutes);
app.use('/api/messages', authenticate, friendsMsgsRoutes);
app.use('/api/users', authenticate, userRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve React app for specific allowed routes
const allowedRoutes = ['/', '/terms'];
app.get(allowedRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Catch-all route to serve React's index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).send('Wait! Something broke!');
});

// Start scheduled jobs
cronJobs.scheduleJobs();

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});