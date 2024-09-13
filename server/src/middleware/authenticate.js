const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Check for token in headers or cookies
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token and extract payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT Payload:', decoded); 
    
    // Ensure userId exists in the token payload
    if (!decoded.userId) {
      return res.status(400).json({ message: 'Invalid token: userId missing.' });
    }

    // Attach userId to req.user
    req.user = { userId: decoded.userId };
    console.log('Token decoded and req.user set:', req.user);  

    next();
  } catch (error) {
    console.log('Invalid token:', error.message);  
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticate;