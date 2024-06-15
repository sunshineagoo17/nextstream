const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use("/api/users", userRoutes);

module.exports = app;