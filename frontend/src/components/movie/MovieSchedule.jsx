import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import showtimeService from '../../services/showtimeService';
import MoviePoster from '../common/MoviePoster';
import { AgeBadge } from '../common/Badge';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import { LoadingSection } from '../common/LoadingState';
import {
  formatTime,
  toLocalDateString,
  getRelativeDayLabel,
  formatVND,
} from '../../utils/formatters';
import './MovieSchedule.css';

export default function MovieSchedule({
  movie,
  cinema,
  cinemas = [],
  selectedCinemaId,
  onSelectCinema,
}) {
  // Generate 7 consecutive upcoming days starting strictly from REAL today
  const upcomingDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        dateObj: d,
        dateStr: toLocalDateString(d),
        dayNumber: d.getDate(),
        label: getRelativeDayLabel(d, today),
      });
    }
    return days;
  }, []);

  const [userSelectedDate, setUserSelectedDate] = useState(() => {
    return toLocalDateString(new Date());
  });

  // Ensure activeDate is always a valid upcoming date without needing an effect
  const activeDate = useMemo(() => {
    const isValid = upcomingDays.some((d) => d.dateStr === userSelectedDate);
    return isValid ? userSelectedDate : (upcomingDays[0]?.dateStr || '');
  }, [upcomingDays, userSelectedDate]);

  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Fetch showtimes whenever movie, selectedCinemaId, activeDate, or retryTrigger changes
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!movie?.id) return;

    // Abort any ongoing request to prevent stale response overwriting new selection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchSchedule() {
      try {
        const result = await showtimeService.getAllShowtimes({
          movieId: movie.id,
          cinemaId: selectedCinemaId || undefined,
          date: activeDate,
          status: 'SCHEDULED',
          signal: controller.signal,
        });

        const now = new Date();
        // Client-side safety filter: strictly future SCHEDULED showtimes
        const validShowtimes = (result.showtimes || []).filter((st) => {
          const startTime = new Date(st.startTime);
          return st.status === 'SCHEDULED' && startTime > now && !st.cancelledAt;
        });

        // Sort by startTime ascending
        validShowtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        setShowtimes(validShowtimes);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        setError(err.message || 'Không thể tải danh sách suất chiếu.');
        setShowtimes([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchSchedule();

    return () => {
      controller.abort();
    };
  }, [movie?.id, selectedCinemaId, activeDate, retryTrigger]);

  const handleRetry = () => {
    setLoading(true);
    setRetryTrigger((prev) => prev + 1);
  };

  const handleSelectDate = (dateStr) => {
    setLoading(true);
    setUserSelectedDate(dateStr);
  };

  const genresText = Array.isArray(movie?.genres)
    ? movie.genres.join(', ')
    : movie?.genres || '';

  const cinemaName = cinema?.name || 'Đang cập nhật';
  const cinemaAddress = cinema?.address
    ? `${cinema.address}${cinema.city ? `, ${cinema.city}` : ''}`
    : 'Thông tin địa chỉ đang cập nhật';

  return (
    <section className="schedule-container" id="lich-chieu">
      {/* 1. Cinema Selection Tabs (if multiple cinemas exist) */}
      {cinemas.length > 1 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
              }}
            >
              Chọn cụm rạp:
            </span>
            {cinemas.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`btn btn-sm ${c.id === selectedCinemaId ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setLoading(true);
                  if (onSelectCinema) onSelectCinema(c.id);
                }}
              >
                🏢 {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Cinema Top Header matching layout */}
      <div className="schedule-cinema-header">
        <div className="cinema-logo-badge">🏢</div>
        <div className="cinema-meta-info">
          <h3 className="cinema-title">Lịch chiếu tại {cinemaName}</h3>
          <p className="cinema-address">
            {cinemaAddress}
            {cinema?.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${cinema.name} ${cinema.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="cinema-map-link"
              >
                [ Bản đồ ]
              </a>
            )}
          </p>
        </div>
      </div>

      {/* 3. Date Selector Pill Tabs based on real calendar days */}
      <div className="date-selector-wrapper">
        <div className="date-selector-list" role="tablist">
          {upcomingDays.map((item) => {
            const isActive = item.dateStr === activeDate;
            return (
              <button
                key={item.dateStr}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`date-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectDate(item.dateStr)}
              >
                <span className="date-pill-day">{item.dayNumber}</span>
                <span className="date-pill-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Movie Row & Showtimes Content */}
      <div className="schedule-movie-row">
        {movie && (
          <div className="schedule-movie-poster">
            <MoviePoster
              src={movie.posterUrl}
              alt={movie.title}
              title={movie.title}
            />
          </div>
        )}

        <div className="schedule-movie-content">
          {movie && (
            <div>
              <div className="schedule-movie-title-row">
                {movie.ageRating && <AgeBadge rating={movie.ageRating} />}
                <h4 className="schedule-movie-title">{movie.title}</h4>
              </div>
              {genresText && (
                <div className="schedule-movie-genres">{genresText}</div>
              )}
            </div>
          )}

          {/* Format Label: Do not fabricate 2D format if backend does not provide room type */}
          <div className="schedule-format-label">
            <span>🎞️</span>
            <span>
              Suất chiếu tiêu chuẩn
              {movie?.language ? ` • ${movie.language}` : ''}
            </span>
          </div>

          {/* Showtimes Grid with dedicated Loading, Error, and Empty states */}
          {loading ? (
            <LoadingSection
              text="Đang tải danh sách suất chiếu..."
              minHeight="140px"
            />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={handleRetry}
              minHeight="140px"
            />
          ) : showtimes.length > 0 ? (
            <div className="showtime-buttons-grid">
              {showtimes.map((st) => {
                const startTimeStr = formatTime(st.startTime);
                const endTimeStr = formatTime(st.endTime);
                const priceFormatted = formatVND(st.basePrice);

                return (
                  <Link
                    key={st.id}
                    to={`/booking/${st.id}`}
                    className="showtime-pill-btn"
                    title={`Chọn ghế suất ${startTimeStr} ~ ${endTimeStr} (${priceFormatted})`}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {startTimeStr} ~ {endTimeStr}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        marginTop: '2px',
                      }}
                    >
                      {priceFormatted}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="🕒"
              title="Không có suất chiếu khả dụng"
              message={`Hiện chưa có suất chiếu nào tại rạp này cho ngày đã chọn. Vui lòng chọn một ngày khác hoặc chọn cụm rạp khác.`}
              minHeight="140px"
            />
          )}
        </div>
      </div>
    </section>
  );
}
