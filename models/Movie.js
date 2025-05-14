const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  posterUrl: String,
  theater: {
    name: String,
    location: String
  },
  showtimes: [String],
  seats: [
    {
      seatNumber: String,
      row: String,
      col: Number,
      status: String,
      priority: Number,
      adjacent: [String],
      bookedBy: {
        type: String,
        default: null  
      }
    }
  ]
});

module.exports = mongoose.model('Movie', movieSchema);
