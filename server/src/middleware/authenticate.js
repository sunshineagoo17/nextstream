const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Check for token in cookies first, then in headers
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    // Return 401 if no token is found
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the JWT_SECRET and extract the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure that userId is present in the token payload
    if (!decoded.userId) {
      return res.status(400).json({ message: 'Invalid token: userId missing.' });
    }

    // Attach the userId from the token to the request object
    req.user = { userId: decoded.userId };

    // Proceed to the next middleware
    next();
  } catch (error) {  
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticate;