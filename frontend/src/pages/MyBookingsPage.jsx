import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import bookingService from '../services/bookingService';
import showtimeService from '../services/showtimeService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { AgeBadge } from '../components/common/Badge';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import './MyBookingsPage.css';

function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  return `${Number(amount).toLocaleString('vi-VN')} đ`;
}

function formatDateTimeVN(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả', value: '' },
  { key: 'PENDING', label: 'Chờ thanh toán', value: 'PENDING' },
  { key: 'CONFIRMED', label: 'Đã xác nhận', value: 'CONFIRMED' },
  { key: 'CANCELLED', label: 'Đã hủy', value: 'CANCELLED' },
];

export default function MyBookingsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [bookings, setBookings] = useState([]);
  const [showtimesMap, setShowtimesMap] = useState({});
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 1s clock tick for checking expired pending bookings
  const [currentNow, setCurrentNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Bookings for current tab and page
  useEffect(() => {
    let ignore = false;

    async function fetchBookings() {
      try {
        setLoading(true);
        setError(null);

        const currentTabObj = STATUS_TABS.find((t) => t.key === activeTab);
        const statusFilter = currentTabObj?.value || undefined;

        const res = await bookingService.getMyBookings({
          page: currentPage,
          limit: pageSize,
          status: statusFilter,
        });

        if (ignore) return;

        setBookings(res.bookings || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
        });

        // Fetch showtime info for unique showtimeIds to display movie & cinema info
        const showtimeIds = [...new Set((res.bookings || []).map((b) => b.showtimeId).filter(Boolean))];
        if (showtimeIds.length > 0) {
          const promises = showtimeIds.map(async (stId) => {
            try {
              const st = await showtimeService.getShowtimeById(stId);
              return { [stId]: st };
            } catch {
              return { [stId]: null };
            }
          });

          const results = await Promise.all(promises);
          if (!ignore) {
            const merged = Object.assign({}, ...results);
            setShowtimesMap((prev) => ({ ...prev, ...merged }));
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải danh sách vé đã đặt.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchBookings();

    return () => {
      ignore = true;
    };
  }, [activeTab, currentPage, reloadKey]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Vé của tôi' }]} />

      <main className="container my-bookings-page">
        {/* Page Title */}
        <div className="my-bookings-header">
          <div>
            <h1 className="my-bookings-title">Lịch sử đặt vé</h1>
            <p className="my-bookings-subtitle">
              Xem lại các vé đã đặt, kiểm tra trạng thái thanh toán và mã QR vào rạp
            </p>
          </div>
          <Link to="/movies" className="btn btn-primary btn-sm">
            🎬 Đặt vé mới
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="status-tabs-container">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`status-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        {loading ? (
          <LoadingSection text="Đang tải danh sách đặt vé..." minHeight="360px" />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} minHeight="320px" />
        ) : bookings.length === 0 ? (
          <div className="my-bookings-empty">
            <h3>Chưa có đơn đặt vé nào</h3>
            <p>
              {activeTab === 'ALL'
                ? 'Bạn chưa đặt vé xem phim nào tại CineBooking.'
                : `Không tìm thấy đơn đặt vé nào ở trạng thái "${STATUS_TABS.find((t) => t.key === activeTab)?.label}".`}
            </p>
            <Link to="/movies" className="btn btn-primary btn-md" style={{ marginTop: 'var(--space-4)' }}>
              Khám phá phim đang chiếu
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => {
              const showtime = showtimesMap[booking.showtimeId];
              const movie = showtime?.movie;
              const cinema = showtime?.cinema;
              const room = showtime?.room;

              const isHoldExpired =
                booking.status === 'PENDING' &&
                booking.heldUntil &&
                new Date(booking.heldUntil).getTime() < currentNow;

              return (
                <div key={booking.id} className="booking-item-card">
                  {/* Left: Movie poster or icon */}
                  <div className="booking-card-media">
                    {movie?.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="booking-card-poster"
                      />
                    ) : (
                      <div className="booking-card-poster placeholder">🎬</div>
                    )}
                  </div>

                  {/* Middle: Details */}
                  <div className="booking-card-info">
                    <div className="booking-card-top-row">
                      <div className="booking-id-tag">
                        Mã đặt vé: <strong>#{booking.id}</strong>
                      </div>
                      <div className="booking-time-created">
                        Ngày đặt: {formatDateTimeVN(booking.createdAt)}
                      </div>
                    </div>

                    <h3 className="booking-movie-title">
                      {movie?.ageRating && <AgeBadge rating={movie.ageRating} />}{' '}
                      {movie?.title || `Suất chiếu #${booking.showtimeId}`}
                    </h3>

                    <div className="booking-meta-grid">
                      <div className="meta-cell">
                        <span className="meta-label">Rạp chiếu:</span>
                        <span className="meta-value">
                          {cinema?.name ? `${cinema.name} (${cinema.city})` : 'Đang tải...'}
                        </span>
                      </div>

                      <div className="meta-cell">
                        <span className="meta-label">Suất chiếu:</span>
                        <span className="meta-value">
                          {showtime?.startTime
                            ? formatDateTimeVN(showtime.startTime)
                            : 'Đang tải...'}
                          {room?.name ? ` - ${room.name}` : ''}
                        </span>
                      </div>

                      <div className="meta-cell">
                        <span className="meta-label">Tổng tiền:</span>
                        <span className="meta-price">{formatVND(booking.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge & Actions */}
                  <div className="booking-card-actions">
                    <div className="status-badge-wrapper">
                      {booking.status === 'CONFIRMED' ? (
                        <span className="status-badge confirmed">● Đã xác nhận</span>
                      ) : booking.status === 'CANCELLED' ? (
                        <span className="status-badge cancelled">● Đã hủy</span>
                      ) : isHoldExpired ? (
                        <span className="status-badge expired">● Hết hạn giữ</span>
                      ) : (
                        <span className="status-badge pending">● Đang giữ ghế</span>
                      )}
                    </div>

                    <div className="actions-buttons-wrapper">
                      {/* PENDING: Tiếp tục thanh toán & Xem chi tiết */}
                      {booking.status === 'PENDING' && !isHoldExpired && (
                        <Link
                          to={`/bookings/${booking.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          💳 Thanh toán
                        </Link>
                      )}

                      {/* CONFIRMED: Xem vé & Xem chi tiết */}
                      {booking.status === 'CONFIRMED' && (
                        <Link
                          to={`/tickets/${booking.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Xem vé QR
                        </Link>
                      )}

                      {/* CANCELLED or EXPIRED: Đặt lại & Xem chi tiết */}
                      {(booking.status === 'CANCELLED' || isHoldExpired) && booking.showtimeId && (
                        <Link
                          to={`/booking/${booking.showtimeId}`}
                          className="btn btn-secondary btn-sm"
                        >
                          🎬 Đặt lại
                        </Link>
                      )}

                      {/* Xem chi tiết luôn có */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Trang trước
            </button>
            <span className="pagination-info">
              Trang {currentPage} / {pagination.totalPages} ({pagination.total} đơn)
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Trang sau →
            </button>
          </div>
        )}
      </main>
    </>
  );
}
