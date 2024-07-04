const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const emailRoutes = require('./src/routes/emailRoutes');
require('dotenv').config(); 

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/email', emailRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server listen
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
