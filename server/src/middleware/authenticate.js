const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('Token decoded and req.user set:', req.user); 
    next();
  } catch (error) {
    console.log('Invalid token:', error.message);
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticate;