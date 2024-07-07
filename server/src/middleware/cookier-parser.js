const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json()); // Body parser middleware for JSON payloads
app.use(cookieParser()); // Cookie parser middleware

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
  
    // Example: Validate user credentials (replace with your authentication logic)
    if (email === 'user@example.com' && password === 'password') {
      const user = { id: 1, email: 'user@example.com' }; // Example user object
  
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Set cookie with the JWT token
      res.cookie('token', token, {
        httpOnly: true, // Cookie accessible only by the web server (not JavaScript)
        secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
        sameSite: 'strict', // Restrict cookie to same-site requests
        expires: new Date(Date.now() + 3600000), // Cookie expiry in 1 hour
      });
  
      // Respond with userId (if needed by the client)
      res.json({ userId: user.id });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });