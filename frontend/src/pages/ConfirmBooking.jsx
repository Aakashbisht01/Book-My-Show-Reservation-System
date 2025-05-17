import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function ConfirmBooking() {
  const username = localStorage.getItem('username'); 
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState('');
  const [message, setMessage] = useState('');

  const confirmBooking = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/movies/book', {
        username,
        title: state.title,
        showtime: state.showtime,
        seatNumbers: state.lockedSeats,
        email,
        phone,
        card,
      });
      setMessage(res.data.message);
      navigate('/home');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
      <p>Seats: {state.lockedSeats.join(', ')}</p>
      <input
        placeholder="Phone"
        className="border w-full p-2 mb-2"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        placeholder="Email"
        className="border w-full p-2 mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Card Details"
        className="border w-full p-2 mb-4"
        value={card}
        onChange={(e) => setCard(e.target.value)}
      />
      <button
        onClick={confirmBooking}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Confirm
      </button>
      {message && <p className="mt-4 text-blue-700 font-semibold">{message}</p>}
    </div>
  );
}
