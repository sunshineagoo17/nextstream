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

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await db.raw('SELECT 1+1 AS result');
        res.status(200).json({ message: 'Database connection successful', result: result[0] });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});
  
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});