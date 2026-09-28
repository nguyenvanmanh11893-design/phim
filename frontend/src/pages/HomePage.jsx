import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import movieService from '../services/movieService';
import HeroBanner from '../components/movie/HeroBanner';
import MovieCard from '../components/common/MovieCard';
import { LoadingSection, SkeletonCard } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import './HomePage.css';

export default function HomePage() {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [hotMovies, setHotMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        // Explicitly query now_showing and coming_soon with separate status filters
        // Do not query 20 random movies and client-filter, do not swallow API errors
        const [nowShowingRes, comingSoonRes, hotMoviesRes] = await Promise.all([
          movieService.getMovies({ status: 'now_showing', limit: 8 }),
          movieService.getMovies({ status: 'coming_soon', limit: 8 }),
          movieService.getHotMovies().catch(() => []), // hot movies can be optional if none booked yet
        ]);

        if (ignore) return;

        const showing = nowShowingRes.movies || [];
        const coming = comingSoonRes.movies || [];
        const hot = hotMoviesRes || [];

        // No fallback that mixes now_showing with coming_soon or all movies!
        setNowShowing(showing);
        setComingSoon(coming);
        setHotMovies(hot);

        const bannerMovie =
          (hot.length > 0 ? hot[0] : null) ||
          (showing.length > 0 ? showing[0] : null) ||
          (coming.length > 0 ? coming[0] : null);

        setFeaturedMovie(bannerMovie);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải dữ liệu trang chủ');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <main className="container home-page">
        <LoadingSection text="Đang tải danh sách phim..." minHeight="380px" />
        <div className="movie-grid" style={{ marginTop: 'var(--space-6)' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container home-page" style={{ paddingTop: 'var(--space-8)' }}>
        <ErrorState message={error} onRetry={handleRetry} minHeight="360px" />
      </main>
    );
  }

  return (
    <main className="container home-page">
      {/* 1. Featured Banner */}
      {featuredMovie && <HeroBanner movie={featuredMovie} />}

      {/* 2. Hot Movies Section (if available) */}
      {hotMovies.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">Phim Nổi Bật</h2>
            <Link to="/movies" className="section-link-more">
              <span>Xem tất cả</span>
              <span>›</span>
            </Link>
          </div>
          <div className="movie-grid">
            {hotMovies.slice(0, 4).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Phim Đang Chiếu (Strictly now_showing) */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">Phim Đang Chiếu</h2>
          <Link to="/movies?tab=now_showing" className="section-link-more">
            <span>Xem tất cả</span>
            <span>›</span>
          </Link>
        </div>

        {nowShowing.length > 0 ? (
          <div className="movie-grid">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🎬"
            title="Chưa có phim đang chiếu"
            message="Hiện tại chưa có phim nào trong lịch chiếu hiện tại."
          />
        )}
      </section>

      {/* 4. Phim Sắp Chiếu (Strictly coming_soon) */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">Phim Sắp Chiếu</h2>
          <Link to="/movies?tab=coming_soon" className="section-link-more">
            <span>Xem tất cả</span>
            <span>›</span>
          </Link>
        </div>

        {comingSoon.length > 0 ? (
          <div className="movie-grid">
            {comingSoon.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📅"
            title="Chưa có phim sắp chiếu"
            message="Hiện tại danh sách phim sắp khởi chiếu đang được cập nhật."
          />
        )}
      </section>
    </main>
  );
}
