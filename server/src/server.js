require('dotenv').config();
const express = require('express');
const knex = require('knex');

const app = express();
const port = process.env.PORT || 5050;

const db = knex({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8'
  }
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Database Host:', process.env.DB_HOST);
  console.log('Database User:', process.env.DB_USER);
  console.log('Database Password:', process.env.DB_PASSWORD);
  console.log('Database Name:', process.env.DB_NAME);
});
