const jwt = require('jsonwebtoken');

const guestAuthenticate = (req, res, next) => {
  const token = req.cookies.guestToken;
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No guest token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'guest') {
      return res.status(403).json({ message: 'Access denied. Not a guest.' });
    }
    req.user = decoded; 
    next();
  } catch (error) {
    console.log('Invalid guest token:', error.message);
    res.status(400).json({ message: 'Invalid guest token.' });
  }
};

module.exports = guestAuthenticate;