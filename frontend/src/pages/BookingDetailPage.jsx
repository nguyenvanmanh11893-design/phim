import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { AgeBadge } from '../components/common/Badge';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import './BookingDetailPage.css';

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

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Cancel action state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState(null);
  const [cancelErrorMsg, setCancelErrorMsg] = useState(null);

  // Payment initiation state
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState(null);

  // 1s clock tick for countdown timer
  const [currentNow, setCurrentNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch booking details by ID
  useEffect(() => {
    let ignore = false;

    async function fetchBooking() {
      try {
        const data = await bookingService.getBookingById(bookingId);
        if (ignore) return;
        setBooking(data);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải thông tin đặt vé.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchBooking();

    return () => {
      ignore = true;
    };
  }, [bookingId, reloadKey]);

  // Derived countdown timer values
  const isPending = booking?.status === 'PENDING';
  const targetMs = booking?.heldUntil ? new Date(booking.heldUntil).getTime() : 0;
  const remainingSeconds =
    isPending && targetMs > 0 ? Math.max(0, Math.floor((targetMs - currentNow) / 1000)) : 0;
  const isExpired = isPending && targetMs > 0 && remainingSeconds <= 0;

  const timerMins = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const formattedTimer = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  // Handle Cancel Booking: PATCH /bookings/:id/cancel
  const handleCancelBooking = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt vé này không? Ghế đang giữ sẽ được giải phóng cho khách hàng khác.')) {
      return;
    }

    setIsCancelling(true);
    setCancelErrorMsg(null);
    setCancelSuccessMsg(null);

    try {
      await bookingService.cancelBooking(booking.id);
      // Cập nhật trạng thái hiển thị sau khi backend xác nhận hủy thành công
      setBooking((prev) => ({ ...prev, status: 'CANCELLED' }));
      setCancelSuccessMsg('Đã hủy đơn đặt vé thành công. Ghế đã được giải phóng.');
    } catch (err) {
      setCancelErrorMsg(err.message || 'Không thể hủy đơn đặt vé. Vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Proceed to Payment: re-verify booking -> POST /payments -> navigate to /checkout/:bookingId?paymentId=:id
  const handleProceedToPayment = async () => {
    setIsInitiatingPayment(true);
    setPaymentErrorMsg(null);
    setCancelErrorMsg(null);

    try {
      // 1. Kiểm tra lại booking từ backend
      const freshBooking = await bookingService.getBookingById(booking.id);
      setBooking(freshBooking);

      if (freshBooking.status !== 'PENDING') {
        throw new Error(`Đơn đặt vé đang ở trạng thái "${freshBooking.status}", không thể thanh toán.`);
      }

      const freshRemaining = freshBooking.heldUntil
        ? Math.floor((new Date(freshBooking.heldUntil).getTime() - Date.now()) / 1000)
        : 0;

      if (freshRemaining <= 0) {
        throw new Error('Đã hết thời gian giữ ghế cho đơn đặt vé này.');
      }

      // 2. POST /payments với bookingId và provider MOCK
      const payment = await paymentService.createPayment({
        bookingId: freshBooking.id,
        provider: 'MOCK',
      });

      if (!payment || !payment.id) {
        throw new Error('Không nhận được mã phiên thanh toán từ máy chủ.');
      }

      // 3. Lấy payment.id và điều hướng tới trang checkout
      navigate(`/checkout/${freshBooking.id}?paymentId=${payment.id}`);
    } catch (err) {
      setPaymentErrorMsg(err.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <main className="container booking-detail-page">
        <LoadingSection text="Đang tải thông tin đơn đặt vé..." minHeight="380px" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="container booking-detail-page">
        <ErrorState
          message={error || 'Không tìm thấy thông tin đơn đặt vé.'}
          onRetry={handleRetry}
          minHeight="320px"
        />
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/movies')}
          >
            ← Danh sách phim
          </button>
        </div>
      </main>
    );
  }

  const { showtime, seats = [], combos = [] } = booking;
  const movie = showtime?.movie;
  const room = showtime?.room;
  const cinema = showtime?.cinema;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Phim', to: '/movies' },
          { label: 'Chi tiết đặt vé' },
        ]}
      />

      <main className="container booking-detail-page">
        <div className="booking-detail-card">
          {/* Header */}
          <div className="booking-detail-header">
            <div>
              <div className="booking-detail-id">
                <span>Mã đặt vé #{booking.id}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tạo lúc: {formatDateTimeVN(booking.createdAt)}
              </div>
            </div>

            <div>
              {booking.status === 'CONFIRMED' ? (
                <span className="booking-status-badge confirmed">
                  <span>●</span> Đã xác nhận
                </span>
              ) : booking.status === 'CANCELLED' ? (
                <span className="booking-status-badge cancelled">
                  <span>●</span> Đã hủy
                </span>
              ) : isExpired ? (
                <span className="booking-status-badge cancelled">
                  <span>●</span> Hết hạn giữ ghế
                </span>
              ) : (
                <span className="booking-status-badge pending">
                  <span>●</span> Đang giữ ghế
                </span>
              )}
            </div>
          </div>

          {/* Cancellation Notification */}
          {cancelSuccessMsg && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                color: '#4ade80',
                fontSize: '0.9rem',
                marginTop: 'var(--space-4)',
              }}
            >
              ✅ {cancelSuccessMsg}
            </div>
          )}

          {cancelErrorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                color: '#f87171',
                fontSize: '0.9rem',
                marginTop: 'var(--space-4)',
              }}
            >
              ⚠️ {cancelErrorMsg}
            </div>
          )}

          {/* Held Until Timer Banner (only for PENDING) */}
          {booking.status === 'PENDING' && (
            <>
              {!isExpired ? (
                <div className="held-timer-banner active">
                  <div>
                    <strong style={{ color: '#facc15', fontSize: '1rem', display: 'block' }}>
                      ⏳ Ghế đang được giữ tạm thời
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Vui lòng hoàn tất thanh toán trước khi hết thời gian giữ ghế.
                    </span>
                  </div>
                  <div className="timer-digits-box">
                    <span className={`timer-clock ${remainingSeconds < 120 ? 'warning' : ''}`}>
                      {formattedTimer}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="held-timer-banner expired">
                  <div>
                    <strong style={{ color: '#f87171', fontSize: '1rem', display: 'block' }}>
                      ⌛ Đã hết thời gian giữ ghế (10 phút)
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Ghế bạn chọn đã tự động được giải phóng cho khách hàng khác. Vui lòng chọn lại suất chiếu để đặt lại vé.
                    </span>
                  </div>
                  <Link
                    to={booking.showtimeId ? `/booking/${booking.showtimeId}` : '/movies'}
                    className="btn btn-secondary btn-sm"
                  >
                    Chọn lại suất chiếu
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Movie & Showtime Info Grid */}
          <div className="detail-section-grid">
            {movie?.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie?.title || 'Poster phim'}
                className="detail-movie-poster"
              />
            ) : (
              <div
                className="detail-movie-poster"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '2rem',
                }}
              >
                🎬
              </div>
            )}

            <div className="detail-info-list">
              <div className="detail-info-row">
                <span>Tên phim:</span>
                <strong>
                  {movie?.ageRating && <AgeBadge rating={movie.ageRating} />}{' '}
                  {movie?.title || 'Đang cập nhật'}
                </strong>
              </div>

              <div className="detail-info-row">
                <span>Rạp chiếu:</span>
                <strong>
                  {cinema?.name} ({cinema?.city})
                </strong>
              </div>

              <div className="detail-info-row">
                <span>Phòng chiếu:</span>
                <strong>
                  {room?.name} {room?.type ? `(${room.type})` : ''}
                </strong>
              </div>

              <div className="detail-info-row">
                <span>Suất chiếu:</span>
                <strong>{formatDateTimeVN(showtime?.startTime)}</strong>
              </div>

              <div className="detail-info-row">
                <span>Thời lượng:</span>
                <strong>{movie?.duration ? `${movie.duration} phút` : '---'}</strong>
              </div>
            </div>
          </div>

          {/* Items & Price Breakdown */}
          <div className="detail-items-box">
            <h4 className="detail-items-title">Chi tiết ghế & dịch vụ</h4>

            {/* Seats */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Ghế ngồi ({seats.length} ghế):
              </div>
              {seats.map((seat) => (
                <div key={seat.id || seat.seatId} className="detail-item-line">
                  <span>
                    Ghế <strong>{seat.seatLabel}</strong> ({seat.seatType})
                  </span>
                  <strong>{formatVND(seat.price)}</strong>
                </div>
              ))}
            </div>

            {/* Combos */}
            {combos.length > 0 && (
              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Combo bắp nước:
                </div>
                {combos.map((combo) => (
                  <div key={combo.id || combo.comboId} className="detail-item-line">
                    <span>
                      {combo.comboName} × {combo.quantity}
                    </span>
                    <strong>{formatVND(combo.price * combo.quantity)}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Total Price */}
            <div className="detail-total-row">
              <div>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Tổng tiền:
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (Bao gồm thuế và phí dịch vụ)
                </div>
              </div>
              <span className="detail-total-price">{formatVND(booking.totalPrice)}</span>
            </div>
          </div>

          {/* Payment error message */}
          {paymentErrorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                color: '#f87171',
                fontSize: '0.9rem',
                marginTop: 'var(--space-4)',
              }}
            >
              ⚠️ {paymentErrorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="detail-actions-footer">
            <Link to="/movies" className="btn btn-secondary">
              ← Tiếp tục xem phim
            </Link>

            {booking.status === 'PENDING' && !isExpired && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171' }}
                  disabled={isCancelling || isInitiatingPayment}
                  onClick={handleCancelBooking}
                >
                  {isCancelling ? 'Đang hủy...' : 'Hủy đặt vé'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isCancelling || isInitiatingPayment}
                  onClick={handleProceedToPayment}
                >
                  {isInitiatingPayment ? 'Đang chuẩn bị...' : ' Thanh toán'}
                </button>
              </>
            )}

            {booking.status === 'CONFIRMED' && (
              <Link to={`/tickets/${booking.id}`} className="btn btn-primary">
                Xem vé điện tử
              </Link>
            )}

            {(booking.status === 'CANCELLED' || isExpired) && booking.showtimeId && (
              <Link to={`/booking/${booking.showtimeId}`} className="btn btn-primary">
                🎬 Đặt lại suất chiếu này
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
