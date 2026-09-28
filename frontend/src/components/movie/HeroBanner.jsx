import { Link } from 'react-router';
import MoviePoster from '../common/MoviePoster';
import { AgeBadge } from '../common/Badge';
import './HeroBanner.css';

export default function HeroBanner({ movie }) {
  if (!movie) return null;

  const genresText = Array.isArray(movie.genres)
    ? movie.genres.join(', ')
    : movie.genres || '';

  return (
    <div className="hero-banner">
      {/* Background backdrop blur */}
      {movie.posterUrl && (
        <img
          src={movie.posterUrl}
          alt=""
          className="hero-banner-backdrop"
          aria-hidden="true"
        />
      )}
      <div className="hero-banner-overlay" />

      <div className="hero-banner-content">
        <div className="hero-poster-box">
          <MoviePoster
            src={movie.posterUrl}
            alt={movie.title}
            title={movie.title}
          />
        </div>

        <div className="hero-details">
          <div className="hero-tag">
            <span>🔥</span>
            <span>Phim Nổi Bật</span>
          </div>

          <h1 className="hero-title">{movie.title}</h1>

          <div className="hero-meta-row">
            {movie.ageRating && <AgeBadge rating={movie.ageRating} />}
            {movie.duration && <span>⏱️ {movie.duration} phút</span>}
            {genresText && <span>🎭 {genresText}</span>}
            {movie.language && <span>🌐 {movie.language}</span>}
          </div>

          {movie.description && (
            <p className="hero-description">{movie.description}</p>
          )}

          <div className="hero-actions">
            <Link to={`/movies/${movie.id}`} className="btn btn-primary">
              Đặt vé ngay
            </Link>
            <Link to={`/movies/${movie.id}`} className="btn btn-secondary">
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
