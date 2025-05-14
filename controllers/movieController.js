const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const Redis = require('ioredis');
const redis = new Redis();
const { findSeatsDFS } = require('../utils/dfs');

const LOCK_TIMEOUT = 300; 

async function lockSeats(username, movieTitle, seatNumbers) {
  const locked = [];
  const failed = [];

  for (const seat of seatNumbers) {
    const key = `lock:${movieTitle}:${seat}`;
    const currentHolder = await redis.get(key);

    if (!currentHolder) {
      const result = await redis.set(key, username, 'NX', 'EX', LOCK_TIMEOUT);
      if (result === 'OK') {
        locked.push(seat);
      } else {
        const holder = await redis.get(key);
        if (holder === username) {
          await redis.expire(key, LOCK_TIMEOUT);
          locked.push(seat);
        } else {
          failed.push({ seat, holder });
        }
      }
    } else if (currentHolder === username) {
      await redis.expire(key, LOCK_TIMEOUT);
      locked.push(seat);
    } else {
      failed.push({ seat, holder: currentHolder });
    }
  }

  return { locked, failed };
}

async function unlockSeats(movieTitle, seatNumbers) {
  for (const seat of seatNumbers) {
    const key = `lock:${movieTitle}:${seat}`;
    await redis.del(key);
  }
}

exports.getAllMovies = async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
};

exports.getMovieByTitle = async (req, res) => {
  const movie = await Movie.findOne({ title: req.params.title });
  if (!movie) return res.status(404).send('Movie not found');
  res.json(movie);
};

exports.getShowtimes = async (req, res) => {
  const movie = await Movie.findOne({ title: req.params.title });
  if (!movie) return res.status(404).send('Movie not found');
  res.json(movie.showtimes);
};

exports.getSeats = async (req, res) => {
  const { title } = req.params;
  const movie = await Movie.findOne({ title });
  if (!movie) return res.status(404).send('Movie not found');

  const seatsWithLockStatus = await Promise.all(
    movie.seats.map(async seat => {
      const key = `lock:${title}:${seat.seatNumber}`;
      const lockedBy = await redis.get(key);
      return {
        ...seat.toObject(),
        lockedBy
      };
    })
  );

  res.json(seatsWithLockStatus);
};

exports.bookSeats = async (req, res) => {
  const { username, title, showtime, seatNumbers, numSeats } = req.body;
  const movie = await Movie.findOne({ title });
  if (!movie) return res.status(404).send('Movie not found');

  const available = movie.seats.filter(s => s.status === 'available');

  let seatsToBook = [];
  if (seatNumbers && seatNumbers.length > 0) {
    const { locked, failed } = await lockSeats(username, title, seatNumbers);
    if (failed.length > 0) {
      return res.status(400).send({ message: 'Some seats are locked by others', failed });
    }
    seatsToBook = available.filter(s => locked.includes(s.seatNumber));
    if (seatsToBook.length !== seatNumbers.length) {
      return res.status(400).send('Some selected seats are unavailable');
    }
  } else if (numSeats) {
    const unlocked = [];
    for (const seat of available) {
      const key = `lock:${title}:${seat.seatNumber}`;
      const holder = await redis.get(key);
      if (!holder || holder === username) unlocked.push(seat);
    }
    const adjacent = findSeatsDFS(unlocked, numSeats);
    if (!adjacent) return res.status(400).send('No adjacent seats available');
    const { locked, failed } = await lockSeats(username, title, adjacent.map(s => s.seatNumber));
    if (failed.length > 0) return res.status(400).send('Could not lock all seats');
    seatsToBook = adjacent;
  } else {
    return res.status(400).send('Please provide either seatNumbers or numSeats');
  }

  for (const seat of seatsToBook) {
    const index = movie.seats.findIndex(s => s.seatNumber === seat.seatNumber);
    movie.seats[index].status = 'booked';
    movie.seats[index].bookedBy = username;
  }

  await movie.save();

  const bookingDocs = seatsToBook.map(seat => ({
    username,
    movieTitle: title,
    seatNumber: seat.seatNumber,
  }));
  await Booking.insertMany(bookingDocs);

  res.send({ message: 'Booking confirmed', seats: seatsToBook.map(s => s.seatNumber) });
};

exports.cancelBooking = async (req, res) => {
  const { username, title, seats } = req.body;
  const movie = await Movie.findOne({ title });
  if (!movie) return res.status(404).send('Movie not found');

  const bookings = await Booking.find({ username, movieTitle: title, seatNumber: { $in: seats } });

  if (bookings.length !== seats.length) {
    return res.status(403).send('You can only cancel seats you booked');
  }

  for (let seatNumber of seats) {
    const index = movie.seats.findIndex(s => s.seatNumber === seatNumber);
    if (index >= 0) {
      movie.seats[index].status = 'available';
      movie.seats[index].bookedBy = null;
    }
  }

  await unlockSeats(title, seats);
  await movie.save();
  await Booking.deleteMany({ username, movieTitle: title, seatNumber: { $in: seats } });

  res.send('Booking cancelled');
};

exports.updateBooking = async (req, res) => {
  const { username, title, oldSeats, newSeats } = req.body;
  const movie = await Movie.findOne({ title });
  if (!movie) return res.status(404).send('Movie not found');

  const existingBookings = await Booking.find({ username, movieTitle: title, seatNumber: { $in: oldSeats } });

  if (existingBookings.length !== oldSeats.length) {
    return res.status(403).send('You can only update seats you booked');
  }

  for (let seat of oldSeats) {
    const index = movie.seats.findIndex(s => s.seatNumber === seat);
    if (index >= 0 && movie.seats[index].status === 'booked') {
      movie.seats[index].status = 'available';
      movie.seats[index].bookedBy = null;
    }
  }
  await unlockSeats(title, oldSeats);
  await Booking.deleteMany({ username, movieTitle: title, seatNumber: { $in: oldSeats } });

  const { locked, failed } = await lockSeats(username, title, newSeats);
  if (failed.length > 0) {
    return res.status(400).send({ message: 'Some seats are locked by others', failed });
  }

  for (let seat of newSeats) {
    const index = movie.seats.findIndex(s => s.seatNumber === seat);
    if (index >= 0) {
      movie.seats[index].status = 'booked';
      movie.seats[index].bookedBy = username;
    }
  }

  await movie.save();

  const newBookings = newSeats.map(seatNumber => ({
    username,
    movieTitle: title,
    seatNumber,
  }));
  await Booking.insertMany(newBookings);

  res.send({
    message: 'Booking updated successfully',
    oldSeats,
    newSeats
  });
};

exports.lockSeatsRoute = async (req, res) => {
  const { username, title, seatNumbers, numSeats } = req.body;
  const movie = await Movie.findOne({ title });
  if (!movie) return res.status(404).send('Movie not found');

  let seatsToLock = [];

  if (seatNumbers && seatNumbers.length > 0) {
    const { locked, failed } = await lockSeats(username, title, seatNumbers);
    if (failed.length > 0) {
      return res.status(400).send({ message: 'Some seats are locked', failed });
    }
    seatsToLock = locked;
  } else if (numSeats) {
    const available = movie.seats.filter(s => s.status === 'available');
    const unlocked = [];
    for (const s of available) {
      const holder = await redis.get(`lock:${title}:${s.seatNumber}`);
      if (!holder || holder === username) unlocked.push(s);
    }
    const adjacent = findSeatsDFS(unlocked, numSeats);
    if (!adjacent) return res.status(400).send('No adjacent seats available');
    const { locked, failed } = await lockSeats(username, title, adjacent.map(s => s.seatNumber));
    if (failed.length > 0) return res.status(400).send('Could not lock all seats');
    seatsToLock = locked;
  }

  res.send({ message: 'Seats locked', locked: seatsToLock });
};
exports.getUserBookings = async (req, res) => {
  const { username } = req.params;

  try {
    const bookings = await Booking.find({ username });

    if (bookings.length === 0) {
      return res.status(404).send('No bookings found for this user');
    }

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send('Server error');
  }
};
