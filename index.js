// Index.js is the entry point

const app = require('./app');
const { MONGODB_URL, PORT } = require('./utils/config')

// Import mongoose module
const mongoose = require('mongoose');

// Connect to mongodb with credentials, stored in .env file
mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");

    // Should run the server, only if DB connection is established
    // Start the server and list on port 3001
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    })
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB", error);
  });