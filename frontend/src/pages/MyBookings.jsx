import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBookings() {
  const username = localStorage.getItem('username');
  const [groupedBookings, setGroupedBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/movies/bookings/${username}`);
        const data = res.data;

        // Group by movieTitle + bookingTime
        const grouped = data.reduce((acc, curr) => {
          const key = `${curr.movieTitle}-${curr.bookingTime}`;
          if (!acc[key]) {
            acc[key] = {
              movieTitle: curr.movieTitle,
              bookingTime: curr.bookingTime,
              seats: []
            };
          }
          acc[key].seats.push(curr.seatNumber);
          return acc;
        }, {});

        setGroupedBookings(Object.values(grouped));
      } catch (err) {
        if (err.response && err.response.status === 404 && err.response.data === 'No bookings found for this user') {
          setGroupedBookings([]); 
        } else {
          setError('Failed to fetch bookings');
        }
      }
    };

    if (username) fetchBookings();
    else setError('No user logged in');
  }, [username]);

  if (error) {
    return <div className="p-6 text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      {groupedBookings.length === 0 ? (
        <p className="text-gray-600">No bookings made.</p>
      ) : (
        <div className="grid gap-4">
          {groupedBookings.map((booking, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h3 className="text-xl font-semibold mb-1">{booking.movieTitle}</h3>
              <p><strong>Seats:</strong> {booking.seats.join(', ')}</p>
              <p><strong>Booking Time:</strong> {new Date(booking.bookingTime).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
