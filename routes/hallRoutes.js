// 1. Create a router
const express = require('express');
const hallRouter = express.Router();

// Add controller to access methods
const hall = require('../controller/hallController');

// 2. Add routes to the router

// Creation of new room
hallRouter.post('/createRoom', hall.createRoom);

// Add new booking
hallRouter.post('/newBooking', hall.newBooking);

// Get all customer with Booked Data
hallRouter.get('/getAllBookedCustomerDetails', hall.getCustomerBookingData);

// Get all booked rooms detail
hallRouter.get('/getAllBookedRoomDetails', hall.getBookedRoomDetails);

// Get all customer bookings count
hallRouter.get('/getCustomerBookingCount/:customerName', hall.getCustomerBookingCount);

// 3. Export the router
module.exports = hallRouter;
