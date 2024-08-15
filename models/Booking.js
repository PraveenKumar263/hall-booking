// To create a model/schema

// Step 1: import mongoose
const mongoose = require('mongoose')

// Step 2: create a schema
// This is object schema to create in DB
const bookingScehma = new mongoose.Schema({
    customer_name: {type: String, required: true},
    date: {type:Date, required: true},
    start_time: {type:Date, required: true},
    end_time: {type:Date, required: true},
    room_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    booking_status: {type: String, deafult:"Confirmed", required: true},
});

// Step 3: export create model
// arg1 is the model name
// arg2 is the schema
// arg3 is collection name
module.exports = mongoose.model('Booking', bookingScehma, 'bookings');