const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/', movieController.getAllMovies);
router.get('/:title', movieController.getMovieByTitle);
router.post('/book', movieController.bookSeats);
router.post('/cancel', movieController.cancelBooking);
router.put('/update', movieController.updateBooking);
router.get('/showtimes/:title', movieController.getShowtimes);
router.get('/seats/:title/:showtime', movieController.getSeats);
router.post('/lock', movieController.lockSeatsRoute);
router.get('/bookings/:username', movieController.getUserBookings);
module.exports = router;
