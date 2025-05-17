import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import MovieDetails from './components/MovieDetails';
import ConfirmBooking from './pages/ConfirmBooking';
import MyBookings from './pages/MyBookings'; // 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/movie/:title" element={<MovieDetails />} />
        <Route path="/confirm-booking" element={<ConfirmBooking />} />
        <Route path="/my-bookings" element={<MyBookings />} /> {}
      </Routes>
    </Router>
  );
}

export default App;
