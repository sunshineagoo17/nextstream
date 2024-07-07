const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser'); 
const emailRoutes = require('./src/routes/emailRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./src/routes/auth'); 
const profileRoutes = require('./src/routes/profileRoutes'); 
require('dotenv').config(); 

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser()); // Use cookie-parser middleware

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only this origin to access resources
  credentials: true // Allow cookies to be sent along with requests
};
app.use(cors(corsOptions));

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
app.use('/api/profile', profileRoutes); 

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