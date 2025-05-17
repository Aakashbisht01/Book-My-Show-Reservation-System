require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// MongoDB models
const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  posterUrl: String,
  theater: {
    name: String,
    location: String
  },
  showtimes: [String],
  seats: [{
    seatNumber: String,
    row: String,
    col: Number,
    status: String,
    priority: Number,
    adjacent: [String]
  }]
});
const Movie = mongoose.model('Movie', movieSchema);

// Theater list
const THEATERS = [
  { name: "Prem Cinema", location: "Haldwani" },
  { name: "W W Cinemas", location: "Haldwani" },
  { name: "Vishal Cinema Hall", location: "Nainital" },
  { name: "New Capitol Cinema", location: "Nainital" },
  { name: "Ashok Theatre", location: "Nainital" }
];

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'bookmyshow',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}

// Generate random showtimes
function generateShowtimes() {
  const times = ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM', '10:00 PM'];
  const shuffled = times.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

// Generate seats with adjacency and priority
function generateSeats(rows = ['A', 'B', 'C', 'D'], cols = 5) {
  const seats = [];
  const seatMap = {};

  rows.forEach(row => {
    for (let col = 1; col <= cols; col++) {
      const seatNumber = `${row}${col}`;
      seatMap[seatNumber] = [];
      if (col > 1) seatMap[seatNumber].push(`${row}${col - 1}`);
      if (col < cols) seatMap[seatNumber].push(`${row}${col + 1}`);
      const rowIdx = rows.indexOf(row);
      if (rowIdx > 0) seatMap[seatNumber].push(`${rows[rowIdx - 1]}${col}`);
      if (rowIdx < rows.length - 1) seatMap[seatNumber].push(`${rows[rowIdx + 1]}${col}`);
    }
  });

  const centerCol = Math.ceil(cols / 2);
  Object.keys(seatMap).forEach(seatNumber => {
    const row = seatNumber[0];
    const col = parseInt(seatNumber.slice(1));
    const priority = Math.abs(centerCol - col);
    seats.push({
      seatNumber,
      row,
      col,
      status: 'available',
      priority,
      adjacent: seatMap[seatNumber]
    });
  });

  return seats;
}

// Main seeding function
async function seedMovies() {
  await connectDB();

  const allMovies = [];

  for (let page = 1; page <= 5; page++) {
    try {
      console.log(`📥 Fetching page ${page} from TMDB...`);
      const url = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=${page}`;
      const response = await axios.get(url);
      allMovies.push(...response.data.results);
    } catch (err) {
      console.error(`❌ Error fetching page ${page}:`, err.message);
    }
  }

  console.log(`✅ Total movies fetched: ${allMovies.length}`);

  for (const movie of allMovies) {
    try {
      const theater = THEATERS[Math.floor(Math.random() * THEATERS.length)];
      const showtimes = generateShowtimes();
      const seats = generateSeats();

      const newMovie = new Movie({
        title: movie.title,
        description: movie.overview,
        posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        theater,
        showtimes,
        seats
      });

      await newMovie.save();
      console.log(`🎬 Saved movie: ${movie.title}`);
    } catch (err) {
      console.error(`❌ Error saving movie ${movie.title}:`, err.message);
    }
  }

  console.log('✅ All movies saved!');
  mongoose.disconnect();
}

seedMovies();
