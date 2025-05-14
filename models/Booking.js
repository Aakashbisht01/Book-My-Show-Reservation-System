const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  username: { type: String, required: true },
  movieTitle: { type: String, required: true },
  seatNumber: { type: String, required: true },
  bookingTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
