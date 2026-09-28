import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import movieService from '../services/movieService';
import cinemaService from '../services/cinemaService';
import useAuth from '../context/useAuth';
import MoviePoster from '../components/common/MoviePoster';
import { AgeBadge } from '../components/common/Badge';
import Breadcrumbs from '../components/common/Breadcrumbs';
import MovieSchedule from '../components/movie/MovieSchedule';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { formatDateVN } from '../utils/formatters';
import './MovieDetailPage.css';

export default function MovieDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [movie, setMovie] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);

  const [movieLoading, setMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState(null);

  const [cinemasLoading, setCinemasLoading] = useState(true);
  const [cinemasError, setCinemasError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  // Ratings & Reviews state
  const [ratings, setRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState({ averageScore: 0, totalRatings: 0 });
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState(null);
  const [ratingReloadKey, setRatingReloadKey] = useState(0);

  // Submit review form state
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // 1. Fetch movie details
  useEffect(() => {
    let ignore = false;

    async function loadMovie() {
      try {
        const movieData = await movieService.getMovieById(id);
        if (ignore) return;
        setMovie(movieData);
        setMovieError(null);
      } catch (err) {
        if (!ignore) {
          setMovieError(err.message || 'Không thể tải thông tin bộ phim.');
        }
      } finally {
        if (!ignore) {
          setMovieLoading(false);
        }
      }
    }

    loadMovie();

    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  // 2. Fetch cinemas list independently
  useEffect(() => {
    let ignore = false;

    async function loadCinemas() {
      try {
        const cinemasRes = await cinemaService.getCinemas({ limit: 50 });
        if (ignore) return;

        const cinemaList = cinemasRes.cinemas || [];
        setCinemas(cinemaList);
        if (cinemaList.length > 0) {
          setSelectedCinemaId(cinemaList[0].id);
        }
        setCinemasError(null);
      } catch (err) {
        if (!ignore) {
          setCinemasError(err.message || 'Không thể tải danh sách cụm rạp.');
        }
      } finally {
        if (!ignore) {
          setCinemasLoading(false);
        }
      }
    }

    loadCinemas();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // 3. Fetch ratings & reviews for this movie
  useEffect(() => {
    let ignore = false;
    async function loadRatings() {
      try {
        const res = await movieService.getMovieRatings(id, { page: 1, limit: 10 });
        if (ignore) return;
        setRatings(res.ratings || []);
        setRatingStats({
          averageScore: Number(res.averageScore) || 0,
          totalRatings: Number(res.totalRatings) || 0,
        });
      } catch (err) {
        if (!ignore) {
          setRatingsError(err.message || 'Không thể tải danh sách đánh giá');
        }
      } finally {
        if (!ignore) {
          setRatingsLoading(false);
        }
      }
    }
    loadRatings();
    return () => {
      ignore = true;
    };
  }, [id, ratingReloadKey]);

  // 4. Submit review handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setReviewFormError(null);
    setReviewSuccess(false);
    setSubmittingReview(true);

    try {
      await movieService.createMovieRating(id, {
        score: reviewScore,
        review: reviewComment.trim() || undefined,
      });

      setReviewSuccess(true);
      setReviewComment('');
      setRatingsLoading(true);
      setRatingReloadKey((k) => k + 1);
    } catch (err) {
      if (err.status === 403) {
        setReviewFormError('Bạn chỉ có thể đánh giá phim sau khi đã mua vé và xem phim này.');
      } else if (err.status === 409) {
        setReviewFormError('Bạn đã gửi đánh giá cho phim này trước đó rồi.');
      } else {
        setReviewFormError(err.message || 'Không thể gửi đánh giá');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRetryAll = () => {
    setReloadKey((k) => k + 1);
  };

  const scrollToSchedule = () => {
    const el = document.getElementById('lich-chieu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (movieLoading) {
    return (
      <main className="container detail-page" style={{ paddingTop: 'var(--space-8)' }}>
        <LoadingSection text="Đang tải thông tin chi tiết phim..." minHeight="420px" />
      </main>
    );
  }

  if (movieError || !movie) {
    return (
      <main className="container detail-page" style={{ paddingTop: 'var(--space-8)' }}>
        <ErrorState
          message={movieError || 'Không tìm thấy bộ phim yêu cầu.'}
          onRetry={handleRetryAll}
          minHeight="360px"
        />
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link to="/movies" className="btn btn-secondary btn-sm">
            ← Quay lại danh sách phim
          </Link>
        </div>
      </main>
    );
  }

  const directorsText = Array.isArray(movie.directors)
    ? movie.directors.join(', ')
    : movie.directors || 'Đang cập nhật';

  const genresList = Array.isArray(movie.genres)
    ? movie.genres
    : movie.genres
      ? [movie.genres]
      : [];

  const currentCinema =
    cinemas.find((c) => c.id === selectedCinemaId) || cinemas[0] || null;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Phim', to: '/movies' },
          { label: movie.title },
        ]}
      />

      <main className="container detail-page">
        {/* Hero Detail Section */}
        <section className="detail-hero-card">
          <div className="detail-poster-wrapper">
            <MoviePoster
              src={movie.posterUrl}
              alt={movie.title}
              title={movie.title}
            />
          </div>

          <div className="detail-info-wrapper">
            <div className="detail-title-group">
              {movie.ageRating && <AgeBadge rating={movie.ageRating} />}
              <h1 className="detail-title">{movie.title}</h1>
            </div>

            {/* Rating summary badge */}
            <div className="detail-rating-quick">
              <span className="star-icon">⭐</span>
              <strong className="rating-score">
                {ratingStats.averageScore ? ratingStats.averageScore.toFixed(1) : 'Chưa có'}
              </strong>
              <span className="rating-count">
                ({ratingStats.totalRatings} lượt đánh giá)
              </span>
            </div>

            {/* Meta Table */}
            <div className="detail-meta-table">
              <div className="meta-row">
                <span className="meta-label">Thể loại:</span>
                <div className="meta-value">
                  {genresList.length > 0 ? (
                    <div className="genre-tags-list">
                      {genresList.map((g, i) => (
                        <span key={i} className="genre-tag-item">
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>Đang cập nhật</span>
                  )}
                </div>
              </div>

              <div className="meta-row">
                <span className="meta-label">Thời lượng:</span>
                <span className="meta-value">
                  {movie.duration ? `${movie.duration} phút` : 'Đang cập nhật'}
                </span>
              </div>

              <div className="meta-row">
                <span className="meta-label">Khởi chiếu:</span>
                <span className="meta-value">
                  {formatDateVN(movie.releaseDate)}
                </span>
              </div>

              <div className="meta-row">
                <span className="meta-label">Đạo diễn:</span>
                <span className="meta-value">{directorsText}</span>
              </div>

              <div className="meta-row">
                <span className="meta-label">Ngôn ngữ:</span>
                <span className="meta-value">
                  {movie.language || 'Đang cập nhật'}
                </span>
              </div>
            </div>

            {/* Description */}
            {movie.description && (
              <div className="detail-description-section">
                <h3 className="section-subheading">Nội dung phim</h3>
                <p className="detail-description-text">{movie.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="detail-action-bar">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={scrollToSchedule}
              >
                Mua vé ngay
              </button>
            </div>
          </div>
        </section>

        {/* Cinemas loading/error section if cinemas failed to load */}
        {cinemasLoading ? (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <LoadingSection text="Đang tải danh sách rạp chiếu..." minHeight="80px" />
          </div>
        ) : cinemasError ? (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <ErrorState
              message={cinemasError}
              onRetry={handleRetryAll}
              minHeight="120px"
            />
          </div>
        ) : (
          /* Movie Schedule Section */
          <MovieSchedule
            movie={movie}
            cinema={currentCinema}
            cinemas={cinemas}
            selectedCinemaId={selectedCinemaId}
            onSelectCinema={setSelectedCinemaId}
          />
        )}

        {/* Ratings & Reviews Section */}
        <section className="movie-reviews-section">
          <div className="reviews-section-header">
            <h2 className="reviews-title">Khán Giả Đánh Giá & Bình Luận</h2>
            <div className="reviews-overall-score">
              <span className="score-big">
                {ratingStats.averageScore ? ratingStats.averageScore.toFixed(1) : '0.0'}
              </span>
              <div className="score-stars-col">
                <span className="stars-render">
                  {'★'.repeat(Math.round(ratingStats.averageScore || 0))}
                  {'☆'.repeat(5 - Math.round(ratingStats.averageScore || 0))}
                </span>
                <span className="total-ratings-label">
                  {ratingStats.totalRatings} lượt đánh giá từ khán giả
                </span>
              </div>
            </div>
          </div>

          {/* Review Submission Form */}
          <div className="review-form-card">
            <h3 className="review-form-title">✍️ Đánh giá của bạn</h3>

            {!isAuthenticated ? (
              <div className="review-login-prompt">
                <p>Bạn cần đăng nhập để gửi đánh giá và chia sẻ cảm nhận về bộ phim này.</p>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                {reviewSuccess && (
                  <div className="review-form-success">
                    ✓ Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận.
                  </div>
                )}
                {reviewFormError && (
                  <div className="review-form-error">⚠️ {reviewFormError}</div>
                )}

                <div className="form-group-rating">
                  <label>Chấm điểm số sao:</label>
                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-pick-btn ${star <= reviewScore ? 'active' : ''}`}
                        onClick={() => setReviewScore(star)}
                        title={`${star} sao`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="star-label-text">{reviewScore} / 5 sao</span>
                  </div>
                </div>

                <div className="form-group-comment">
                  <label htmlFor="user-review-comment">Nhận xét chi tiết (tùy chọn):</label>
                  <textarea
                    id="user-review-comment"
                    rows={3}
                    className="review-textarea"
                    placeholder="Hãy chia sẻ cảm nhận của bạn về diễn xuất, âm thanh, hình ảnh..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    maxLength={1000}
                  />
                  <span className="char-counter">{reviewComment.length}/1000 ký tự</span>
                </div>

                <div className="form-submit-row">
                  <span className="review-note">
                    * Lưu ý: Chỉ khán giả đã đặt vé và xem phim mới có thể gửi đánh giá.
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Reviews List */}
          <div className="reviews-list-container">
            {ratingsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Đang tải đánh giá...</p>
              </div>
            ) : ratingsError ? (
              <div className="review-form-error">⚠️ {ratingsError}</div>
            ) : ratings.length === 0 ? (
              <div className="no-reviews-box">
                <p>Chưa có đánh giá nào cho phim này. Hãy là người đầu tiên để lại cảm nhận!</p>
              </div>
            ) : (
              <div className="reviews-cards-list">
                {ratings.map((r) => (
                  <div key={r.id} className="user-review-card">
                    <div className="user-review-header">
                      <div className="user-review-meta">
                        <div className="review-user-avatar">
                          {r.user?.avatarUrl ? (
                            <img src={r.user.avatarUrl} alt={r.user.name} />
                          ) : (
                            <span>{r.user?.name ? r.user.name.charAt(0).toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div>
                          <strong className="user-review-name">
                            {r.user?.name || 'Khán giả CineBooking'}
                          </strong>
                          <span className="user-review-date">{formatDateVN(r.createdAt)}</span>
                        </div>
                      </div>

                      <div className="user-review-stars">
                        {'★'.repeat(r.score)}
                        {'☆'.repeat(5 - r.score)}
                      </div>
                    </div>

                    {r.review && <p className="user-review-comment">{r.review}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
