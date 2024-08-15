// Import express module
const express = require('express');

// Create an express application
const app = express();

// import the db model in the todo.js
const Room = require('./models/CreateRoom');
const Booking = require('./models/Booking');

// import date-format pkg
const { parse, format, parseISO } = require('date-fns');
const formatDateString = 'dd/MM/yyyy';
const formatTimeString = 'HH:mm';

// use the express middleware for parsing of json bodies
app.use(express.json());

// Define a route handler for the default "GET" request "/"
app.get('/', (req, res) => {
  res.json({message: "Hello World!"});
});

// Creation of new room
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
    res.status(500).send({message: error.message});
  }
});

// Add new booking
app.post('/api/v1/newBooking', async (req, res) => {
  try {
    // Get info about new booking
    const {customer_name, date, start_time, end_time, room_number, booking_status = 'Confirmed'} = req.body;

    // Format string to Date obj
    const parsed_date = parse(date, formatDateString, new Date());
    const parsed_start_time = parse(`${date} ${start_time}`, `${formatDateString} ${formatTimeString}`, new Date());
    const parsed_end_time = parse(`${date} ${end_time}`, `${formatDateString} ${formatTimeString}`, new Date());

    // Ensure parsed values are valid dates
    if (isNaN(parsed_date) || isNaN(parsed_start_time) || isNaN(parsed_end_time)) {
      return res.status(400).send({ message: 'Invalid date or time format' });
    }

    // Find room id
    const room_id = await findRoomID(room_number);
    if(!room_id) {
      return res.status(400).send({ message: 'Room not found' });
    }
    
    // Check if the room is available
    const available = await isRoomAvailable(room_id, parsed_date, parsed_start_time, parsed_end_time);
    if (!available) {
      return res.status(400).send({ message: 'Room is not available for the selected time' });
    }

    // Create a new booking
    const newBooking = new Booking({
      customer_name, 
      date: parsed_date,
      start_time: parsed_start_time,
      end_time: parsed_end_time, 
      room_id, 
      booking_status
    });

    // Save new booking
    const savedBooking = await newBooking.save();
    res.send({message: 'Booking Confirmed', booking: savedBooking});
  } catch(error) {
    res.status(500).send({message: error.message});
  }
});

// Get all customer with Booked Data
app.get('/api/v1/getAllBookedCustomerDetails', async (req, res) => {
  try {
    const bookedRooms = await Booking.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'room_id',
          foreignField: '_id',
          as: 'room_details'
        }
      },
      {
        $unwind: '$room_details'
      },
      {
        $project: {
          _id: 0,
          customer_name: 1,
          room_number: '$room_details.room_number',
          date: 1,
          start_time: 1,
          end_time: 1
        }
      }
    ]);

    // To format the date, start time & end time
    const fmtBookedRooms = bookedRooms.map(booking => ({
      ...booking,
      date: booking.date ? format(booking.date, formatDateString) : null,
      start_time: booking.start_time ? format(booking.start_time, formatTimeString) : null,
      end_time: booking.end_time ? format(booking.end_time, formatTimeString) : null
    }));

    res.send(fmtBookedRooms);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Get all booked rooms detail
app.get('/api/v1/getAllBookedRoomDetails', async (req, res) => {
  try {
    const bookedRooms = await Booking.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'room_id',
          foreignField: '_id',
          as: 'room_details'
        }
      },
      {
        $unwind: '$room_details'
      },
      {
        $project: {
          _id: 0,
          room_name: '$room_details.room_number',
          booking_status: 1,
          date: 1,
          start_time: 1,
          end_time: 1
        }
      }
    ]);

    // To format the date, start time & end time
    const fmtBookedRooms = bookedRooms.map(booking => ({
      ...booking,
      date: booking.date ? format(booking.date, formatDateString) : null,
      start_time: booking.start_time ? format(booking.start_time, formatTimeString) : null,
      end_time: booking.end_time ? format(booking.end_time, formatTimeString) : null
    }));

    res.send(fmtBookedRooms);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Get all customer bookings count
app.get('/api/v1/getCustomerBookingCount/:customerName', async (req, res) => {
  try {
    const { customerName } = req.params;

    const customerBookingDetails = await Booking.aggregate([
      { $match: { customer_name: customerName } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room_id',
          foreignField: '_id',
          as: 'room_details'
        }
      },
      { $unwind: '$room_details' },
      {
        $project: {
          _id: 0,
          customer_name: 1,
          room_name: '$room_details.room_number',
          date: 1,
          start_time: 1,
          end_time: 1,
          room_id: 1,
          booking_date: 1,
          booking_status: 1
        }
      },
      {
        $group: {
          _id: '$customer_name',
          total_bookings: { $sum: 1 },
          bookings: { $push: "$$ROOT" }
        }
      }
    ]);

    if (customerBookingDetails.length === 0) {
      return res.status(404).send({ message: 'No bookings found for this customer' });
    }

    res.send({
      customer_name: customerBookingDetails[0]._id,
      total_bookings: customerBookingDetails[0].total_bookings,
      bookings: customerBookingDetails[0].bookings
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// To find room and return only _id
async function findRoomID(room_number) {
  try {
    const room = await Room.findOne({room_number: room_number}, { _id: 1 });
    if(!room) {
      return 0;
    }

    return room._id;
  } catch (error) {
    throw new Error('Error finding room id: ' + error.message);
  }
}

// Checking if booking already exist for given date & time range
async function isRoomAvailable(room_id, date, start_time, end_time) {
  try {
    const overlappingBookings = await Booking.find({
      room_id: room_id,
      date: date,
      $or: [
        { 
          start_time: { $lt: end_time }, 
          end_time: { $gt: start_time }
        }
      ]
    });

    return overlappingBookings.length === 0;
  } catch (error) {
    throw new Error('Error checking room availability: ' + error.message);
  }
};


module.exports = app;