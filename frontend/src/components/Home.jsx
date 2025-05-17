import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    axios.get('http://localhost:5000/api/movies')
      .then(res => setMovies(res.data));
  }, []);

  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Welcome, {username}</h1>
        <button
          onClick={() => navigate('/my-bookings')} // ✅ correct route path
          className="block w-full text-left px-4 py-2 rounded hover:bg-gray-200 mt-2"
        >
          My Bookings
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        <input
          type="text"
          placeholder="Search movie..."
          className="w-full p-2 mb-4 rounded border"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(movie => (
            <div
              key={movie._id}
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg"
              onClick={() => navigate(`/movie/${encodeURIComponent(movie.title)}`)}
            >
              <img src={movie.posterUrl} alt={movie.title} className="rounded-xl h-60 w-full object-cover mb-2" />
              <h2 className="text-xl font-semibold">{movie.title}</h2>
              <p className="text-sm text-gray-600">{movie.description.slice(0, 100)}...</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
