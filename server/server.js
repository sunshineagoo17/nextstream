const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const emailRoutes = require('./src/routes/emailRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profileRoutes');
const tmdbRoutes = require('./src/routes/tmdbRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const interactionRoutes = require('./src/routes/interactionRoutes');
const cronJobs = require('./src/services/cronJobs');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));

// Initialize NodeCache with TTL of 1 hour
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

// Serve uploaded avatars
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Start scheduled jobs
cronJobs.scheduleJobs();

// API Routes
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/interactions', interactionRoutes);

// Serve static files from the React app if needed
app.use(express.static(path.join(__dirname, 'client/build')));

// Serve React app for specific routes
const allowedRoutes = ['/','/terms']; 
app.get(allowedRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Wait! Something broke!');
});

// Server listen
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Hey you. The server's running on port ${PORT}`);
});