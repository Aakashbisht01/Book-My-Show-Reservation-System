const MovieCard = ({ movie }) => {
  return (
    <div className="w-[200px] h-[300px] bg-black rounded-lg p-4 flex flex-col items-center">
      <img src={movie.poster} alt={movie.title} className="w-full h-[70%] rounded-lg" />
      <h2 className="text-white text-lg font-bold mt-2">{movie.title}</h2>
      <p className="text-gray-400 text-sm">⭐ {movie.rating}/10</p>
    </div>
  );
};

export default MovieCard;
