const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const emailRoutes = require('./src/routes/emailRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser'); 
const authRoutes = require('./src/routes/auth'); 
require('dotenv').config(); 

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// API Routes
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes); 

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