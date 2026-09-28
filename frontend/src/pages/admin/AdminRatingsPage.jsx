import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { movieService } from '../../services/movieService';
import { formatDateVN } from '../../utils/formatters';
import './AdminRatingsPage.css';

export default function AdminRatingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMovieId = searchParams.get('movieId');

  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(queryMovieId || '');

  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({ averageScore: 0, totalRatings: 0 });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [error, setError] = useState(null);

  // Load all movies for selector
  useEffect(() => {
    let isMounted = true;
    async function loadMovies() {
      try {
        const res = await movieService.getMovies({ limit: 100 });
        if (isMounted) {
          const list = res.data || res.movies || [];
          setMovies(list);
          if (!queryMovieId && list.length > 0) {
            setSelectedMovieId(String(list[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        if (isMounted) setLoadingMovies(false);
      }
    }
    loadMovies();
    return () => {
      isMounted = false;
    };
  }, [queryMovieId]);

  // Derived selectedMovie object
  const selectedMovie = useMemo(() => {
    if (!selectedMovieId || movies.length === 0) return null;
    return movies.find((m) => String(m.id) === String(selectedMovieId)) || null;
  }, [selectedMovieId, movies]);

  // Fetch ratings for current movie
  useEffect(() => {
    if (!selectedMovieId) return;

    let ignore = false;
    async function loadRatings() {
      try {
        const res = await movieService.getMovieRatings(selectedMovieId, {
          page,
          limit: 10,
        });

        if (ignore) return;
        setRatings(res.ratings || []);
        setStats({
          averageScore: Number(res.averageScore) || 0,
          totalRatings: Number(res.totalRatings) || 0,
        });
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
        });
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách đánh giá');
        }
      } finally {
        if (!ignore) {
          setLoadingRatings(false);
        }
      }
    }

    loadRatings();
    return () => {
      ignore = true;
    };
  }, [selectedMovieId, page]);

  const handleSelectMovie = (e) => {
    const id = e.target.value;
    setSelectedMovieId(id);
    setPage(1);
    if (id) {
      setSearchParams({ movieId: id });
    } else {
      setSearchParams({});
    }
  };

  const renderStars = (score) => {
    const s = Math.round(Number(score) || 0);
    return (
      <span className="star-rating-render" title={`${score} / 5 sao`}>
        {'★'.repeat(Math.min(5, Math.max(0, s)))}
        {'☆'.repeat(Math.max(0, 5 - s))}
      </span>
    );
  };

  return (
    <div className="admin-ratings-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Đánh Giá Phim</h2>
          <p>Xem nhận xét, chấm điểm và phản hồi của khán giả sau khi xem phim</p>
        </div>
      </div>

      {/* Movie Selector Bar */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group" style={{ flex: 1, maxWidth: '500px' }}>
          <label className="admin-filter-label">Chọn phim cần xem:</label>
          <select
            className="admin-select"
            style={{ width: '100%' }}
            value={selectedMovieId}
            onChange={handleSelectMovie}
            disabled={loadingMovies}
          >
            {loadingMovies ? (
              <option>Đang tải danh sách phim...</option>
            ) : (
              movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.duration} phút)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Selected Movie Stats Banner */}
      {selectedMovie && (
        <div className="ratings-movie-banner">
          <div className="movie-banner-thumb">
            {selectedMovie.posterUrl ? (
              <img src={selectedMovie.posterUrl} alt={selectedMovie.title} />
            ) : (
              <span>🎬</span>
            )}
          </div>
          <div className="movie-banner-info">
            <h3>{selectedMovie.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Thể loại: {Array.isArray(selectedMovie.genres) ? selectedMovie.genres.join(', ') : 'N/A'} •
              Thời lượng: {selectedMovie.duration} phút
            </p>

            <div className="ratings-stat-pills">
              <div className="score-pill">
                <span className="score-number">
                  {stats.averageScore ? stats.averageScore.toFixed(1) : '0.0'}
                </span>
                <div className="score-details">
                  {renderStars(stats.averageScore)}
                  <span className="score-count">({stats.totalRatings} lượt đánh giá)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="admin-card">
        <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>
          Danh sách nhận xét của người dùng ({pagination.total})
        </h3>

        {loadingRatings ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải đánh giá...</p>
          </div>
        ) : error ? (
          <div className="admin-form-error-banner">⚠️ {error}</div>
        ) : ratings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Chưa có người dùng nào đánh giá phim này
          </div>
        ) : (
          <div className="reviews-list">
            {ratings.map((r) => (
              <div key={r.id} className="review-card-item">
                <div className="review-header">
                  <div className="review-user-info">
                    <div className="review-user-avatar">
                      {r.user?.avatarUrl ? (
                        <img src={r.user.avatarUrl} alt={r.user.name} />
                      ) : (
                        <span>{r.user?.name ? r.user.name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div>
                      <strong className="review-user-name">
                        {r.user?.name || 'Khán giả CineBooking'}
                      </strong>
                      <span className="review-date">{formatDateVN(r.createdAt)}</span>
                    </div>
                  </div>

                  <div className="review-score-stars">
                    {renderStars(r.score)}
                    <span className="score-val">{r.score} / 5</span>
                  </div>
                </div>

                <div className="review-body">
                  <p>{r.review || r.comment || '(Không có nhận xét văn bản)'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="admin-pagination" style={{ marginTop: '1.5rem', border: 'none' }}>
            <span>
              Trang {page} / {pagination.totalPages}
            </span>
            <div className="admin-pagination-btns">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Trang trước
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
