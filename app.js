// Import express module
const express = require('express');

// Create an express application
const app = express();

// import the db model in the todo.js
const Room = require('./models/createRoom');

// use the express middleware for parsing of json bodies
app.use(express.json());

// Define a route handler for the default "GET" request "/"
app.get('/', (req, res) => {
  res.json({message: "Hello World!"});
});

// Creatio of new room
app.post('/api/v1/createRoom', async (req, res) => {
  try {
    // Get info from request body
    const { room_number, seats_available, amenities, price_per_hour } = req.body;

    // create a new room
    const newRoom = new Room({
        room_number, seats_available, amenities, price_per_hour
    });

    // Save the room to DB
    const savedRoom = await newRoom.save();
    res.send({message: 'Room created successfully', room: savedRoom});
  } catch(error) {
    res.status(500).send({message: error.message})
  }
});

module.exports = app;