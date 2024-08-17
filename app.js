// Import express module
const express = require('express');
const hallRouter = require('./routes/hallRoutes');

// Create an express application
const app = express();

// use the express middleware for parsing of json bodies
app.use(express.json());

// Establish the routes prefix
app.use('/api/v1', hallRouter);

module.exports = app;