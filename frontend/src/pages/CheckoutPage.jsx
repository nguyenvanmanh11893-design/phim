import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { AgeBadge } from '../components/common/Badge';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import './CheckoutPage.css';

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

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentIdParam = searchParams.get('paymentId');
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Simulation execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [failureMessage, setFailureMessage] = useState(null);

  // 1s clock tick for countdown timer
  const [currentNow, setCurrentNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Booking & Payment data
  useEffect(() => {
    let ignore = false;

    async function loadCheckoutData() {
      try {
        setLoading(true);
        setError(null);
        setActionError(null);

        // 1. Fetch booking details
        const bookingData = await bookingService.getBookingById(bookingId);
        if (ignore) return;
        setBooking(bookingData);

        // 2. Fetch payment details if paymentId is present
        if (paymentIdParam) {
          const paymentData = await paymentService.getPaymentById(paymentIdParam);
          if (ignore) return;

          // Check if payment belongs to this booking
          if (Number(paymentData.bookingId) !== Number(bookingId)) {
            throw new Error('Phiên thanh toán không khớp với đơn đặt vé này.');
          }
          setPayment(paymentData);
        } else {
          setPayment(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải thông tin thanh toán.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCheckoutData();

    return () => {
      ignore = true;
    };
  }, [bookingId, paymentIdParam, reloadKey]);

  // Handle manual session initialization if paymentId was missing
  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    setActionError(null);
    try {
      const freshBooking = await bookingService.getBookingById(bookingId);
      setBooking(freshBooking);

      if (freshBooking.status !== 'PENDING') {
        throw new Error(`Đơn đặt vé đang ở trạng thái "${freshBooking.status}", không thể tạo thanh toán.`);
      }

      const p = await paymentService.createPayment({
        bookingId: freshBooking.id,
        provider: 'MOCK',
      });
      setPayment(p);
      setSearchParams({ paymentId: p.id });
      setFailureMessage(null);
    } catch (err) {
      setActionError(err.message || 'Không thể tạo phiên thanh toán mới.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle Mock Confirm Payment: POST /payments/:id/confirm
  const handleConfirmMock = async () => {
    if (!payment?.id || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const result = await paymentService.confirmPayment(payment.id);
      // Backend returns { message, payment, booking, ticket }
      // Navigate straight to electronic ticket page
      navigate(`/tickets/${bookingId}`, {
        replace: true,
        state: { confirmedNow: true, message: result.message },
      });
    } catch (err) {
      setActionError(err.message || 'Xác nhận thanh toán thất bại.');
      setIsSubmitting(false);
    }
  };

  // Handle Mock Fail Payment: POST /payments/:id/fail
  const handleFailMock = async () => {
    if (!payment?.id || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const result = await paymentService.failPayment(payment.id);
      // Update payment state to FAILED
      if (result.payment) {
        setPayment(result.payment);
      } else {
        setPayment((prev) => (prev ? { ...prev, status: 'FAILED' } : null));
      }
      setFailureMessage(
        result.message || 'Đã mô phỏng thanh toán thất bại. Đơn đặt vé vẫn được giữ nếu còn hạn.'
      );
    } catch (err) {
      setActionError(err.message || 'Không thể thực hiện hủy phiên thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <main className="container checkout-page">
        <LoadingSection text="Đang tải cổng thanh toán..." minHeight="400px" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="container checkout-page">
        <ErrorState
          message={error || 'Không tìm thấy thông tin đơn đặt vé để thanh toán.'}
          onRetry={handleRetry}
          minHeight="320px"
        />
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link to={`/bookings/${bookingId}`} className="btn btn-secondary btn-sm">
            ← Quay lại chi tiết đặt vé
          </Link>
        </div>
      </main>
    );
  }

  // Calculate timer based on the earlier of booking.heldUntil and payment.expiredAt
  const bookingHoldMs = booking.heldUntil ? new Date(booking.heldUntil).getTime() : 0;
  const paymentExpMs = payment?.expiredAt ? new Date(payment.expiredAt).getTime() : Infinity;
  const earliestExpiryMs = payment ? Math.min(bookingHoldMs, paymentExpMs) : bookingHoldMs;

  const remainingSeconds =
    booking.status === 'PENDING' && earliestExpiryMs > 0
      ? Math.max(0, Math.floor((earliestExpiryMs - currentNow) / 1000))
      : 0;

  const isHoldExpired = booking.status === 'PENDING' && bookingHoldMs > 0 && currentNow > bookingHoldMs;
  const isPaymentExpired = payment && payment.status === 'PENDING' && currentNow > paymentExpMs;
  const isSessionExpired = isHoldExpired || isPaymentExpired;

  const timerMins = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const formattedTimer = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  const { showtime, seats = [], combos = [] } = booking;
  const movie = showtime?.movie;
  const cinema = showtime?.cinema;
  const room = showtime?.room;

  // Check if booking already confirmed
  if (booking.status === 'CONFIRMED') {
    return (
      <main className="container checkout-page">
        <div className="checkout-card confirmed-state">
          <div className="checkout-status-icon">🎉</div>
          <h2>Đơn đặt vé đã thanh toán thành công!</h2>
          <p className="checkout-desc">
            Vé điện tử của bạn đã được phát hành và gửi về email. Bạn có thể xem mã QR ngay bây giờ.
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to={`/tickets/${booking.id}`} className="btn btn-primary">
              Xem vé điện tử & Mã QR
            </Link>
            <Link to="/my-bookings" className="btn btn-secondary">
              Lịch sử đặt vé
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Check if booking is cancelled
  if (booking.status === 'CANCELLED') {
    return (
      <main className="container checkout-page">
        <div className="checkout-card cancelled-state">
          <div className="checkout-status-icon">❌</div>
          <h2>Đơn đặt vé đã bị hủy</h2>
          <p className="checkout-desc">
            Đơn đặt vé #{booking.id} đã bị hủy. Ghế đã được giải phóng cho khách hàng khác.
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            {booking.showtimeId && (
              <Link to={`/booking/${booking.showtimeId}`} className="btn btn-primary">
                🎬 Chọn lại suất chiếu
              </Link>
            )}
            <Link to="/movies" className="btn btn-secondary">
              Danh sách phim
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Phim', to: '/movies' },
          { label: `Đặt vé #${booking.id}`, to: `/bookings/${booking.id}` },
          { label: 'Thanh toán' },
        ]}
      />

      <main className="container checkout-page">
        <div className="checkout-card">
          {/* Header */}
          <div className="checkout-header">
            <div>
              <span className="checkout-tag">Cổng thanh toán điện tử</span>
              <h1 className="checkout-title">Thanh toán vé xem phim</h1>
              <div className="checkout-subtitle">Mã đơn đặt vé: #{booking.id}</div>
            </div>

            {/* Timer Badge */}
            {!isSessionExpired && remainingSeconds > 0 && (
              <div className={`checkout-countdown-badge ${remainingSeconds < 120 ? 'urgent' : ''}`}>
                <span className="countdown-icon">⏳</span>
                <div>
                  <span className="countdown-label">Thời gian còn lại:</span>
                  <span className="countdown-time">{formattedTimer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Banner Thông báo hết hạn */}
          {isSessionExpired && (
            <div className="checkout-alert expired">
              <span className="alert-icon">⌛</span>
              <div>
                <strong>
                  {isHoldExpired ? 'Đã hết thời gian giữ ghế!' : 'Phiên thanh toán đã hết hạn!'}
                </strong>
                <p>
                  {isHoldExpired
                    ? 'Ghế của bạn đã được tự động giải phóng. Vui lòng chọn lại suất chiếu để đặt vé mới.'
                    : 'Phiên thanh toán 15 phút đã kết thúc. Bạn có thể tạo phiên mới nếu thời gian giữ ghế vẫn còn.'}
                </p>
              </div>
            </div>
          )}

          {/* Thông báo lỗi thao tác */}
          {actionError && (
            <div className="checkout-alert error">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Thao tác không thành công</strong>
                <p>{actionError}</p>
              </div>
            </div>
          )}

          {/* Thông báo mô phỏng thất bại */}
          {failureMessage && (
            <div className="checkout-alert warning">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Thanh toán thất bại (Mô phỏng)</strong>
                <p>{failureMessage}</p>
              </div>
            </div>
          )}

          {/* Main 2-column Layout */}
          <div className="checkout-grid">
            {/* Left column: Booking & Showtime Summary */}
            <div className="checkout-summary-column">
              <h3 className="section-heading">Thông tin vé</h3>

              <div className="checkout-movie-card">
                {movie?.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="checkout-poster-img"
                  />
                ) : (
                  <div className="checkout-poster-placeholder">🎬</div>
                )}

                <div className="checkout-movie-meta">
                  <h4 className="checkout-movie-title">
                    {movie?.ageRating && <AgeBadge rating={movie.ageRating} />}{' '}
                    {movie?.title}
                  </h4>
                  <div className="checkout-meta-line">
                    <span>Rạp:</span> <strong>{cinema?.name} ({cinema?.city})</strong>
                  </div>
                  <div className="checkout-meta-line">
                    <span>Phòng:</span> <strong>{room?.name} {room?.type ? `(${room.type})` : ''}</strong>
                  </div>
                  <div className="checkout-meta-line">
                    <span>Suất chiếu:</span> <strong>{formatDateTimeVN(showtime?.startTime)}</strong>
                  </div>
                </div>
              </div>

              {/* Items Detail */}
              <div className="checkout-items-box">
                <div className="checkout-items-group">
                  <span className="items-group-label">Ghế ngồi ({seats.length} ghế):</span>
                  {seats.map((seat) => (
                    <div key={seat.id || seat.seatId} className="checkout-item-row">
                      <span>Ghế <strong>{seat.seatLabel}</strong> ({seat.seatType})</span>
                      <span>{formatVND(seat.price)}</span>
                    </div>
                  ))}
                </div>

                {combos.length > 0 && (
                  <div className="checkout-items-group border-top">
                    <span className="items-group-label">Combo bắp nước:</span>
                    {combos.map((combo) => (
                      <div key={combo.id || combo.comboId} className="checkout-item-row">
                        <span>{combo.comboName} × {combo.quantity}</span>
                        <span>{formatVND(combo.price * combo.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total from backend */}
                <div className="checkout-total-row">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="checkout-total-amount">{formatVND(booking.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Right column: Payment Provider & Action simulation */}
            <div className="checkout-action-column">
              <h3 className="section-heading">Phương thức thanh toán</h3>

              {/* Mock Payment Simulation Box */}
              <div className="mock-payment-box">
                <div className="mock-provider-badge">
                  <span className="provider-icon">🛡️</span>
                  <strong>MOCK PAYMENT SANDBOX</strong>
                </div>

                <div className="mock-notice">
                  <span className="notice-icon">ℹ️</span>
                  <div>
                    <strong>Thanh toán mô phỏng — không thu tiền thật</strong>
                    <p>
                      Hệ thống đang hoạt động ở chế độ thử nghiệm (Sandbox). Bạn có thể bấm chọn kết quả giả lập bên dưới để kiểm tra toàn bộ luồng xử lý.
                    </p>
                  </div>
                </div>

                {payment && (
                  <div className="mock-session-info">
                    <div className="session-info-line">
                      <span>Mã phiên thanh toán:</span>
                      <code>#{payment.id}</code>
                    </div>
                    <div className="session-info-line">
                      <span>Trạng thái phiên:</span>
                      <span className={`payment-status-tag ${payment.status.toLowerCase()}`}>
                        {payment.status === 'PENDING'
                          ? 'Đang chờ xử lý'
                          : payment.status === 'SUCCESS'
                            ? 'Thành công'
                            : 'Thất bại'}
                      </span>
                    </div>
                    <div className="session-info-line">
                      <span>Hết hạn lúc:</span>
                      <span>{formatDateTimeVN(payment.expiredAt)}</span>
                    </div>
                  </div>
                )}

                {/* Simulation Action Buttons */}
                {!isSessionExpired && payment && payment.status === 'PENDING' && (
                  <div className="mock-buttons-group">
                    <button
                      type="button"
                      className="btn btn-primary mock-btn success-btn"
                      disabled={isSubmitting}
                      onClick={handleConfirmMock}
                    >
                      {isSubmitting ? 'Đang xử lý...' : '✅ Mô phỏng thanh toán thành công'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary mock-btn fail-btn"
                      disabled={isSubmitting}
                      onClick={handleFailMock}
                    >
                      {isSubmitting ? 'Đang xử lý...' : '❌ Mô phỏng thanh toán thất bại'}
                    </button>
                  </div>
                )}

                {/* Case: No payment session or payment failed/expired, but booking is still held */}
                {(!payment || payment.status === 'FAILED' || (isPaymentExpired && !isHoldExpired)) && !isHoldExpired && (
                  <div className="retry-session-box">
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                      {payment?.status === 'FAILED'
                        ? 'Phiên thanh toán đã kết thúc. Ghế của bạn vẫn đang được giữ, bạn có thể tạo phiên mới để thử lại.'
                        : 'Chưa có phiên thanh toán hợp lệ hoặc phiên trước đã hết hạn.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isCreatingSession}
                      onClick={handleCreateSession}
                    >
                      {isCreatingSession ? 'Đang khởi tạo...' : '🔄 Khởi tạo lại phiên thanh toán'}
                    </button>
                  </div>
                )}

                {/* Case: Hold completely expired */}
                {isHoldExpired && (
                  <div className="expired-actions-box">
                    <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>
                      Thời gian giữ ghế 10 phút đã kết thúc. Vui lòng chọn lại suất chiếu để đặt chỗ.
                    </p>
                    {booking.showtimeId && (
                      <Link to={`/booking/${booking.showtimeId}`} className="btn btn-primary">
                        🎬 Chọn lại suất chiếu
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation link back to booking detail */}
              <div className="checkout-back-link">
                <Link to={`/bookings/${booking.id}`}>
                  ← Quay lại chi tiết đặt vé (không hủy vé)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
