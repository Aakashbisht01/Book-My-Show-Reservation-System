import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MovieDetails() {
  const { title } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState('');
  const [seats, setSeats] = useState([]);
  const [bookingMode, setBookingMode] = useState('dfs');
  const [seatNumbers, setSeatNumbers] = useState('');
  const [numSeats, setNumSeats] = useState('');
  const [oldSeats, setOldSeats] = useState('');
  const [newSeats, setNewSeats] = useState('');
  const [message, setMessage] = useState('');

  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchMovie = async () => {
      const res = await axios.get(`http://localhost:5000/api/movies/${title}`);
      setMovie(res.data);
    };
    fetchMovie();
  }, [title]);

  const fetchSeats = async (showtime) => {
    setSelectedShowtime(showtime);
    const res = await axios.get(`http://localhost:5000/api/movies/seats/${title}/${showtime}`);
    setSeats(res.data);
  };

  const lockSeats = async () => {
    try {
      const body = {
        username,
        title,
        showtime: selectedShowtime,
        ...(bookingMode === 'dfs'
          ? { numSeats: Number(numSeats) }
          : { seatNumbers: seatNumbers.split(',') }),
      };

      const res = await axios.post('http://localhost:5000/api/movies/lock', body);
      const locked = res.data.locked || [];

      const invalidSeats = seats.filter(
        (seat) => locked.includes(seat.seatNumber) && seat.lockedBy && seat.lockedBy !== username
      );

      if (invalidSeats.length > 0) {
        setMessage(`These seats are locked by another user: ${invalidSeats.map(s => s.seatNumber).join(', ')}`);
        return;
      }

      navigate('/confirm-booking', {
        state: {
          title,
          showtime: selectedShowtime,
          lockedSeats: locked,
        },
      });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Locking failed');
    }
  };

  const cancelBooking = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/movies/cancel', {
        title,
        seats: seatNumbers.split(','),
        username,
      });
      setMessage(res.data || 'Cancellation successful');
      fetchSeats(selectedShowtime);
    } catch (err) {
      setMessage(err.response?.data || 'Cancellation failed');
    }
  };

  const updateBooking = async () => {
    try {
      const res = await axios.put('http://localhost:5000/api/movies/update', {
        title,
        oldSeats: oldSeats.split(','),
        newSeats: newSeats.split(','),
        username,
      });
      setMessage(res.data.message || 'Update successful');
      fetchSeats(selectedShowtime);
    } catch (err) {
      setMessage(err.response?.data || 'Update failed');
    }
  };

  if (!movie) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">{movie.title}</h2>
      <div className="flex gap-6">
        <img src={movie.posterUrl} alt="Poster" className="w-60 rounded-xl shadow-md" />
        <div>
          <p className="text-lg mb-2">{movie.description}</p>
          <p className="text-gray-700">
            Theater: {movie.theater?.name} - {movie.theater?.location}
          </p>
          <div className="mt-4">
            <h3 className="font-semibold mb-1">Showtimes:</h3>
            <div className="flex gap-2">
              {movie.showtimes.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => fetchSeats(st)}
                  className={`px-3 py-1 rounded border ${
                    selectedShowtime === st ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Booking Options</h3>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setBookingMode('dfs')}
                className={`px-3 py-1 rounded border ${
                  bookingMode === 'dfs' ? 'bg-blue-500 text-white' : 'bg-white'
                }`}
              >
                DFS
              </button>
              <button
                onClick={() => setBookingMode('manual')}
                className={`px-3 py-1 rounded border ${
                  bookingMode === 'manual' ? 'bg-blue-500 text-white' : 'bg-white'
                }`}
              >
                By Seat Number
              </button>
            </div>

            {bookingMode === 'dfs' ? (
              <input
                type="number"
                placeholder="Number of Seats"
                className="border p-1 mb-2"
                value={numSeats}
                onChange={(e) => setNumSeats(e.target.value)}
              />
            ) : (
              <input
                type="text"
                placeholder="Seat numbers e.g. A1,A2"
                className="border p-1 mb-2"
                value={seatNumbers}
                onChange={(e) => setSeatNumbers(e.target.value)}
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={lockSeats}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Lock & Confirm
              </button>
              <button
                onClick={cancelBooking}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Update Booking</h3>
            <input
              type="text"
              placeholder="Old Seats"
              className="border p-1 mr-2"
              value={oldSeats}
              onChange={(e) => setOldSeats(e.target.value)}
            />
            <input
              type="text"
              placeholder="New Seats"
              className="border p-1 mr-2"
              value={newSeats}
              onChange={(e) => setNewSeats(e.target.value)}
            />
            <button
              onClick={updateBooking}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Update
            </button>
          </div>

          {message && (
            <p className="mt-4 text-blue-700 font-semibold">{message}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Seat Layout</h3>
        <div className="grid grid-cols-5 gap-2">
          {seats.map((seat) => {
            const isLockedByUser = seat.lockedBy === username;
            const isBookedByUser = seat.bookedBy === username;
            const isBooked = seat.status === 'booked';

            let className = 'text-center py-1 border rounded ';

            if (isBooked) {
              className += isBookedByUser
                ? 'bg-blue-500 text-white'
                : 'bg-red-500 text-white';
            } else if (seat.lockedBy) {
              className += isLockedByUser
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-300 text-gray-500';
            } else {
              className += 'bg-green-300';
            }

            return (
              <div key={seat.seatNumber} className={className}>
                {seat.seatNumber}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
