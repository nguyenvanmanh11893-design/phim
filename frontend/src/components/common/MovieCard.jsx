import { Link } from 'react-router';
import MoviePoster from './MoviePoster';
import { AgeBadge } from './Badge';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  if (!movie) return null;

  const genresText = Array.isArray(movie.genres)
    ? movie.genres.join(', ')
    : movie.genres || '';

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-card-poster-wrapper">
        <MoviePoster
          src={movie.posterUrl}
          alt={movie.title}
          title={movie.title}
        />
        {movie.ageRating && (
          <div className="movie-card-badge">
            <AgeBadge rating={movie.ageRating} />
          </div>
        )}
        <div className="movie-card-overlay">
          <span className="btn-book-preview">Đặt vé ngay</span>
        </div>
      </div>

      <div className="movie-card-content">
        <h3 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h3>

        <div className="movie-card-meta">
          {movie.duration && (
            <span>⏱️ {movie.duration} phút</span>
          )}
          {movie.language && (
            <span>• {movie.language}</span>
          )}
        </div>

        {genresText && (
          <div className="movie-card-genres" title={genresText}>
            {genresText}
          </div>
        )}
      </div>
    </Link>
  );
}
