const jwt = require('jsonwebtoken');

const guestAuthenticate = (req, res, next) => {
  const token = req.cookies.guestToken;
  console.log('Guest Token:', token);  

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No guest token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); 

    // Check if the token is close to expiration (e.g., less than 10 minutes left)
    const timeLeft = decoded.exp * 1000 - Date.now();
    console.log('Time left before token expiration (ms):', timeLeft);

    if (timeLeft < 10 * 60 * 1000) { // 10 minutes in milliseconds
      const newToken = jwt.sign({ role: 'guest' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie('guestToken', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(Date.now() + 3600000)
      });
      console.log('New token generated:', newToken);
    }

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