import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
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
  const [searchParams] = useSearchParams();
  const paymentIdParam = searchParams.get('paymentId');

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // VNPay payment creation state
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [actionError, setActionError] = useState(null);

  // 1s clock tick for countdown timer based strictly on backend heldUntil
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
          try {
            const paymentData = await paymentService.getPaymentById(paymentIdParam);
            if (ignore) return;

            // Check if payment belongs to this booking
            if (Number(paymentData.bookingId) === Number(bookingId)) {
              setPayment(paymentData);
            }
          } catch {
            // Ignored if paymentId is invalid or expired
          }
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

  // Handle VNPay Payment
  const handleVNPayPayment = async () => {
    if (isCreatingPayment || isHoldExpired) return;

    setIsCreatingPayment(true);
    setActionError(null);

    try {
      // Re-verify booking status from backend before requesting payment
      const freshBooking = await bookingService.getBookingById(bookingId);
      setBooking(freshBooking);

      if (freshBooking.status !== 'PENDING') {
        throw new Error(
          `Đơn đặt vé đang ở trạng thái "${freshBooking.status}", không thể tạo thanh toán.`
        );
      }

      const freshHoldMs = freshBooking.heldUntil ? new Date(freshBooking.heldUntil).getTime() : 0;
      if (freshHoldMs <= 0 || Date.now() >= freshHoldMs) {
        throw new Error('Đã hết thời gian giữ ghế. Vui lòng chọn lại suất chiếu để đặt vé mới.');
      }

      // Call POST /payments with provider = 'VNPAY'
      const responseData = await paymentService.createPayment({
        bookingId: Number(freshBooking.id),
        provider: 'VNPAY',
      });

      if (!responseData || !responseData.paymentUrl) {
        throw new Error('Không nhận được đường dẫn thanh toán hợp lệ từ cổng thanh toán VNPay.');
      }

      // Redirect full browser window to VNPay payment URL
      window.location.assign(responseData.paymentUrl);
    } catch (err) {
      // Keep user on checkout page to display clear backend error
      setActionError(err.message || 'Khởi tạo thanh toán VNPay thất bại. Vui lòng thử lại.');
      setIsCreatingPayment(false);
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

  // Countdown timer strictly based on backend heldUntil
  const bookingHoldMs = booking.heldUntil ? new Date(booking.heldUntil).getTime() : 0;
  const remainingSeconds =
    booking.status === 'PENDING' && bookingHoldMs > 0
      ? Math.max(0, Math.floor((bookingHoldMs - currentNow) / 1000))
      : 0;

  const isHoldExpired =
    booking.status === 'PENDING' && bookingHoldMs > 0 && currentNow >= bookingHoldMs;

  const timerMins = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const formattedTimer = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  const { showtime, seats = [], combos = [] } = booking;
  const movie = showtime?.movie;
  const cinema = showtime?.cinema;
  const room = showtime?.room;

  // Check if booking is already confirmed
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
          { label: 'Thanh toán VNPay' },
        ]}
      />

      <main className="container checkout-page">
        <div className="checkout-card">
          {/* Header */}
          <div className="checkout-header">
            <div>
              <span className="checkout-tag">Cổng thanh toán trực tuyến</span>
              <h1 className="checkout-title">Thanh toán vé xem phim</h1>
              <div className="checkout-subtitle">Mã đơn đặt vé: #{booking.id}</div>
            </div>

            {/* Timer Badge */}
            {!isHoldExpired && remainingSeconds > 0 && (
              <div className={`checkout-countdown-badge ${remainingSeconds < 120 ? 'urgent' : ''}`}>
                <span className="countdown-icon">⏳</span>
                <div>
                  <span className="countdown-label">Thời gian giữ ghế:</span>
                  <span className="countdown-time">{formattedTimer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Banner Hold Expired */}
          {isHoldExpired && (
            <div className="checkout-alert expired">
              <span className="alert-icon">⌛</span>
              <div>
                <strong>Đã hết thời gian giữ ghế!</strong>
                <p>
                  Thời gian giữ ghế tạm thời (10 phút) đã kết thúc. Ghế của bạn đã được giải phóng cho khách hàng khác. Vui lòng chọn lại suất chiếu để đặt vé mới.
                </p>
              </div>
            </div>
          )}

          {/* Backend Error Alert */}
          {actionError && (
            <div className="checkout-alert error">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Không thể tiến hành thanh toán</strong>
                <p>{actionError}</p>
              </div>
            </div>
          )}

          {/* Main 2-column Layout */}
          <div className="checkout-grid">
            {/* Left column: Booking & Showtime Summary */}
            <div className="checkout-summary-column">
              <h3 className="section-heading">Thông tin vé đã chọn</h3>

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

            {/* Right column: Payment Provider & Action */}
            <div className="checkout-action-column">
              <h3 className="section-heading">Phương thức thanh toán</h3>

              {/* VNPay Payment Box */}
              <div className="vnpay-payment-box">
                <div className="vnpay-provider-badge">
                  <span className="vnpay-badge-logo">VNPAY</span>
                  <span className="vnpay-badge-sub">SANDBOX — MÔI TRƯỜNG THỬ NGHIỆM</span>
                </div>

                <div className="vnpay-notice">
                  <span className="notice-icon">🛡️</span>
                  <div>
                    <strong>Cổng thanh toán VNPay Sandbox</strong>
                    <p>
                      Giao dịch được xử lý an toàn qua cổng VNPay (môi trường thử nghiệm Sandbox).
                      Sau khi bấm nút bên dưới, hệ thống sẽ chuyển hướng bạn đến giao diện thanh toán chính thức của VNPay.
                    </p>
                  </div>
                </div>

                <div className="vnpay-security-note">
                  <span>🔒</span>
                  <span>
                    Bạn không cần nhập thông tin thẻ ngân hàng trên trang này. Toàn bộ thông tin thanh toán được bảo mật và xử lý trực tiếp trên cổng VNPay.
                  </span>
                </div>

                {payment && (
                  <div className="vnpay-session-info">
                    <div className="session-info-line">
                      <span>Mã phiên thanh toán gần nhất:</span>
                      <code>#{payment.id}</code>
                    </div>
                    <div className="session-info-line">
                      <span>Trạng thái phiên:</span>
                      <span className={`payment-status-tag ${payment.status?.toLowerCase()}`}>
                        {payment.status === 'PENDING'
                          ? 'Đang chờ thanh toán'
                          : payment.status === 'SUCCESS'
                            ? 'Đã thanh toán'
                            : 'Đã kết thúc'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Button: Thanh toán VNPay */}
                {!isHoldExpired ? (
                  <div className="vnpay-button-wrapper">
                    <button
                      type="button"
                      className="btn btn-primary vnpay-pay-btn"
                      disabled={isCreatingPayment}
                      onClick={handleVNPayPayment}
                    >
                      {isCreatingPayment ? (
                        <>
                          <span className="vnpay-btn-spinner" />
                          <span>Đang chuyển hướng sang VNPay...</span>
                        </>
                      ) : (
                        <>
                          <span className="vnpay-btn-icon">💳</span>
                          <span>Thanh toán VNPay</span>
                        </>
                      )}
                    </button>
                    <p className="vnpay-button-hint">
                      Nhấn nút để mở trang thanh toán VNPay Sandbox
                    </p>
                  </div>
                ) : (
                  <div className="expired-actions-box">
                    <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>
                      Thời gian giữ ghế đã kết thúc. Vui lòng chọn lại suất chiếu để đặt chỗ mới.
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
