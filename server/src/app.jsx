const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);

// Root endpoint that logs a message to the console
app.get('/', (req, res) => {
  console.log({ message: 'Hello from the server!' });
  res.status(204).send();  
});

module.exports = app;