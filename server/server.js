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

// Initialize Google Cloud Storage client to load the NLP model
const { Storage } = require('@google-cloud/storage');

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

// Google Cloud credentials for NLP service
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

// Function to load NLP model from Google Cloud Storage
async function loadNlpModel() {
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
  const srcFilename = process.env.GOOGLE_CLOUD_NLP_MODEL_FILENAME;
  const destinationFilename = path.join(__dirname, 'src/services/nlpModel');

  if (!bucketName || !srcFilename) {
    throw new Error('Bucket name or NLP model filename is not defined in the environment variables.');
  }

  if (!fs.existsSync(path.dirname(destinationFilename))) {
    fs.mkdirSync(path.dirname(destinationFilename), { recursive: true });
  }

  console.log(`Downloading model from ${bucketName}/${srcFilename} to ${destinationFilename}`);
  await storage.bucket(bucketName).file(srcFilename).download({ destination: destinationFilename });
  console.log(`NLP Model downloaded to ${destinationFilename}`);
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
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
      const savedMessage = await knex('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message,
        is_read: false,
        created_at: knex.fn.now(),
      });

      io.to(receiverId).emit('receive_message', {
        senderId,
        receiverId,
        message,
        created_at: new Date(),
      });

      console.log('Message saved and sent:', savedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error_message', {
        message: 'Error sending message. Please try again.',
      });
    }
  });

  socket.on('send_message', (message) => {
    socket.to(message.receiverId).emit('receive_message', message);
  });

  // Listen for new calendar invites
  socket.on('new_calendar_invite', async (data) => {
    const { invitedUserId, inviteDetails } = data;
    try {
      io.to(invitedUserId).emit('receive_calendar_invite', inviteDetails);
      console.log('New calendar invite sent:', inviteDetails);
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      socket.emit('error_calendar_invite', {
        message: 'Error sending calendar invite.',
      });
    }
  });

  // Listen for calendar invite responses
  socket.on('respond_calendar_invite', async (data) => {
    const { inviteId, userId, response } = data;
    try {
      // Update the database with the response (accept/decline)
      await respondToSharedEvent(userId, inviteId, response);

      if (response === 'accepted') {
        // Emit event to update the shared calendar with the accepted invite
        const acceptedInvite = await getInviteDetails(inviteId);
        io.to(userId).emit('calendar_event_updated', { event: acceptedInvite });
      } else {
        // Emit event to remove the declined invite from the shared calendar
        io.to(userId).emit('calendar_event_removed', { inviteId });
      }

      io.to(userId).emit('calendar_invite_responded', { inviteId, response });
    } catch (error) {
      console.error('Error responding to calendar invite:', error);
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
      console.log('New friend request sent:', requestDetails);
    } catch (error) {
      console.error('Error sending friend request:', error);
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
      console.log('Friend request accepted:', friendDetails);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      socket.emit('error_friend_acceptance', {
        message: 'Error accepting friend request.',
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
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
app.use(express.static(path.join(__dirname, 'client/build')));
console.log(`Serving static files from ${path.join(__dirname, 'client/build')}`);

// Serve React app for specific allowed routes
const allowedRoutes = ['/', '/terms'];
app.get(allowedRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Catch-all route to serve React's index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Wait! Something broke!');
});

// Load the NLP model from Google Cloud during server startup
loadNlpModel()
  .then(() => {
    console.log('NLP model successfully loaded from Google Cloud');

    // Start scheduled jobs
    cronJobs.scheduleJobs();

    // Start the server
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error loading NLP model from Google Cloud:', error.message);
    process.exit(1);
  });