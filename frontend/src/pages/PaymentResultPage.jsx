import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router';
import QRCode from 'qrcode';
import paymentService from '../services/paymentService';
import bookingService from '../services/bookingService';
import ticketService from '../services/ticketService';
import useAuth from '../context/useAuth';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { AgeBadge } from '../components/common/Badge';
import { LoadingSection } from '../components/common/LoadingState';
import './PaymentResultPage.css';

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

function getReviewReasonMessage(reason) {
  switch (reason) {
    case 'HOLD_EXPIRED':
      return 'Thời gian giữ ghế đã kết thúc trước khi kết quả thanh toán được ghi nhận.';
    case 'BOOKING_CANCELLED':
      return 'Đơn đặt vé đã bị hủy trước khi hoàn tất thanh toán.';
    case 'SHOWTIME_UNAVAILABLE':
      return 'Suất chiếu đã bắt đầu hoặc đã bị hủy.';
    case 'DUPLICATE_PAYMENT':
      return 'Đơn đặt vé đã có một giao dịch thanh toán thành công trước đó.';
    case 'PAYMENT_OUTSIDE_WINDOW':
      return 'Giao dịch được xử lý ngoài khung thời gian phiên thanh toán.';
    case 'SEAT_CONFLICT':
      return 'Ghế bạn chọn đã bị trùng với đơn đặt khác.';
    default:
      return 'Giao dịch cần được nhân viên đối soát và hỗ trợ xử lý thủ công.';
  }
}

/**
 * Validates internal return path to prevent open redirect vulnerabilities
 */
function isSafeInternalPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const paymentIdParam = searchParams.get('paymentId');
  const urlBookingIdParam = searchParams.get('bookingId');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Validate paymentId: must be a positive integer
  const isValidPaymentId = Boolean(paymentIdParam && /^[1-9]\d*$/.test(paymentIdParam.trim()));
  const paymentId = isValidPaymentId ? Number(paymentIdParam.trim()) : null;

  // Main payment state
  const [payment, setPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(isValidPaymentId);
  const [error, setError] = useState(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Polling state for PENDING status (every ~3s, max ~60s)
  const [isPolling, setIsPolling] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Ticket issuance state (for SUCCESS + reviewRequired === false)
  const [ticket, setTicket] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('IDLE'); // 'IDLE' | 'FETCHING' | 'READY' | 'PENDING_ISSUANCE'
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState(null);

  // Current timestamp tick to avoid impure Date.now() during render
  const [currentNow, setCurrentNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Active refs for safe React lifecycle & StrictMode cleanup
  const pollTimerRef = useRef(null);
  const ticketTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inFlightPaymentRef = useRef(false);
  const inFlightTicketRef = useRef(false);
  const pollingStartTimeRef = useRef(0);
  const isMountedRef = useRef(true);

  // Function refs to avoid circular self-references in callbacks
  const fetchPaymentRef = useRef(null);
  const fetchTicketRef = useRef(null);

  // Ensure isMounted is tracked
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle unauthenticated state: redirect to login preserving safe internal return path
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnPath = location.pathname + location.search;
      if (isSafeInternalPath(returnPath)) {
        navigate('/login', {
          state: { from: location },
          replace: true,
        });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, location, navigate]);

  // Fetch ticket with retry loop (for SUCCESS reviewRequired === false)
  const fetchTicketWithRetry = useCallback(
    async (bookingIdToFetch, isManual = false) => {
      if (!bookingIdToFetch || !isMountedRef.current) return;
      if (inFlightTicketRef.current && !isManual) return;

      inFlightTicketRef.current = true;
      if (isManual) {
        setTicketStatus('FETCHING');
      }

      try {
        const ticketData = await ticketService.getTicketByBookingId(bookingIdToFetch);
        if (!isMountedRef.current) return;

        if (ticketData && ticketData.qrCode) {
          setTicket(ticketData);
          setTicketStatus('READY');

          // Generate QR code
          try {
            const url = await QRCode.toDataURL(ticketData.qrCode, {
              width: 220,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
            });
            if (isMountedRef.current) {
              setTicketQrDataUrl(url);
            }
          } catch (qrErr) {
            console.error('Failed to generate QR data URL:', qrErr);
          }
        } else {
          throw new Error('Vé chưa có thông tin QR code');
        }
      } catch {
        if (!isMountedRef.current) return;
        setTicketStatus('PENDING_ISSUANCE');

        // Automatically retry up to 10 times (~30 seconds)
        if (ticketTimerRef.current) {
          clearTimeout(ticketTimerRef.current);
        }
        ticketTimerRef.current = setTimeout(() => {
          if (fetchTicketRef.current) {
            fetchTicketRef.current(bookingIdToFetch, false);
          }
        }, 3000);
      } finally {
        inFlightTicketRef.current = false;
      }
    },
    []
  );

  // Keep fetchTicketRef updated
  useEffect(() => {
    fetchTicketRef.current = fetchTicketWithRetry;
  }, [fetchTicketWithRetry]);

  // Fetch Payment Status core function
  const fetchPayment = useCallback(
    async (isManualRetry = false) => {
      if (!paymentId || !isMountedRef.current) return;
      if (inFlightPaymentRef.current) return; // Prevent overlapping requests

      inFlightPaymentRef.current = true;
      setIsCheckingPayment(true);

      if (isManualRetry) {
        setLoading(true);
        setPollingTimedOut(false);
        pollingStartTimeRef.current = Date.now();
      }

      // Create new abort controller for this fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = await paymentService.getPaymentById(paymentId, controller.signal);
        if (!isMountedRef.current) return;

        setPayment(data);
        setError(null);
        setIsAccessDenied(false);

        // Fetch associated booking info using backend payment.bookingId (not query param)
        const actualBookingId = data.bookingId;
        if (actualBookingId) {
          bookingService
            .getBookingById(actualBookingId, controller.signal)
            .then((bData) => {
              if (isMountedRef.current) setBooking(bData);
            })
            .catch(() => {
              // Ignore booking detail fetch failure so payment status remains visible
            });
        }

        // Handle State A: PENDING
        if (data.status === 'PENDING') {
          const elapsedMs = Date.now() - pollingStartTimeRef.current;
          if (elapsedMs >= 60000) {
            // Polling timed out at ~60 seconds
            setIsPolling(false);
            setPollingTimedOut(true);
          } else {
            // Continue polling every 3 seconds without overlapping
            setIsPolling(true);
            setPollCount((c) => c + 1);
            if (pollTimerRef.current) {
              clearTimeout(pollTimerRef.current);
            }
            pollTimerRef.current = setTimeout(() => {
              if (fetchPaymentRef.current) {
                fetchPaymentRef.current(false);
              }
            }, 3000);
          }
        } else {
          // Status resolved to SUCCESS or FAILED => Stop polling
          setIsPolling(false);
          setPollingTimedOut(false);

          // Handle State B: SUCCESS and reviewRequired === false
          if (data.status === 'SUCCESS' && !data.reviewRequired) {
            setTicketStatus('FETCHING');
            if (fetchTicketRef.current) {
              fetchTicketRef.current(actualBookingId, true);
            }
          }
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        if (err.name === 'AbortError') return;

        // 401: session expired -> redirect to login
        if (err.status === 401) {
          navigate('/login', {
            state: { from: location },
            replace: true,
          });
          return;
        }

        // 403 or 404: Access denied or payment not found -> Stop polling immediately
        if (err.status === 403 || err.status === 404) {
          setIsAccessDenied(true);
          setIsPolling(false);
          setError('Không thể truy cập giao dịch này.');
          return;
        }

        // Other errors (e.g., temporary 500 or network glitch)
        const elapsedMs = Date.now() - pollingStartTimeRef.current;
        if (elapsedMs < 60000) {
          // Retry polling on next interval
          setIsPolling(true);
          if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
          }
          pollTimerRef.current = setTimeout(() => {
            if (fetchPaymentRef.current) {
              fetchPaymentRef.current(false);
            }
          }, 3000);
        } else {
          setIsPolling(false);
          setPollingTimedOut(true);
          setError(err.message || 'Không thể tải kết quả thanh toán.');
        }
      } finally {
        inFlightPaymentRef.current = false;
        if (isMountedRef.current) {
          setIsCheckingPayment(false);
          setLoading(false);
        }
      }
    },
    [paymentId, location, navigate]
  );

  // Keep fetchPaymentRef updated
  useEffect(() => {
    fetchPaymentRef.current = fetchPayment;
  }, [fetchPayment]);

  // Initialize and start polling when authenticated and paymentId is valid
  useEffect(() => {
    if (authLoading || !isAuthenticated || !isValidPaymentId) return;

    pollingStartTimeRef.current = Date.now();
    if (fetchPaymentRef.current) {
      fetchPaymentRef.current(false);
    }

    return () => {
      // Cleanup all timers and ongoing abort controllers on unmount or paymentId change
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (ticketTimerRef.current) clearTimeout(ticketTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [authLoading, isAuthenticated, isValidPaymentId]);

  // Manual retry handler for payment status
  const handleManualPaymentCheck = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (fetchPaymentRef.current) {
      fetchPaymentRef.current(true);
    }
  };

  // Manual retry handler for ticket fetch
  const handleManualTicketRetry = () => {
    const actualBookingId = payment?.bookingId;
    if (actualBookingId) {
      if (ticketTimerRef.current) clearTimeout(ticketTimerRef.current);
      if (fetchTicketRef.current) {
        fetchTicketRef.current(actualBookingId, true);
      }
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <main className="container payment-result-page">
        <LoadingSection text="Đang xác thực phiên đăng nhập..." minHeight="360px" />
      </main>
    );
  }

  // Not authenticated fallback (handled by useEffect redirect, but guarded for render)
  if (!isAuthenticated) {
    return (
      <main className="container payment-result-page">
        <LoadingSection text="Đang chuyển hướng đến trang đăng nhập..." minHeight="360px" />
      </main>
    );
  }

  // Invalid paymentId on URL
  if (!isValidPaymentId) {
    return (
      <main className="container payment-result-page">
        <div className="result-card error-state">
          <div className="result-icon-badge error">⚠️</div>
          <h2 className="result-title">Mã thanh toán không hợp lệ</h2>
          <p className="result-desc">
            Đường dẫn kết quả thanh toán thiếu thông tin mã giao dịch hoặc mã không đúng định dạng.
          </p>
          <div className="result-actions-row">
            <Link to="/my-bookings" className="btn btn-primary">
              📋 Lịch sử đặt vé
            </Link>
            <Link to="/" className="btn btn-secondary">
              🏠 Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Access denied (403 or 404 from backend)
  if (isAccessDenied) {
    return (
      <main className="container payment-result-page">
        <div className="result-card error-state">
          <div className="result-icon-badge error">🚫</div>
          <h2 className="result-title">Không thể truy cập giao dịch này</h2>
          <p className="result-desc">
            Giao dịch không tồn tại hoặc bạn không có quyền truy cập vào thông tin thanh toán này.
          </p>
          <div className="result-actions-row">
            <Link to="/my-bookings" className="btn btn-primary">
              📋 Lịch sử đặt vé của bạn
            </Link>
            <Link to="/" className="btn btn-secondary">
              🏠 Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Initial loading state before first response arrives
  if (loading && !payment) {
    return (
      <main className="container payment-result-page">
        <div className="result-card loading-state">
          <LoadingSection text="Đang kết nối cổng VNPay và xác nhận kết quả thanh toán..." minHeight="320px" />
        </div>
      </main>
    );
  }

  // General error with no payment data loaded
  if (error && !payment) {
    return (
      <main className="container payment-result-page">
        <div className="result-card error-state">
          <div className="result-icon-badge error">⚠️</div>
          <h2 className="result-title">Không thể tải thông tin thanh toán</h2>
          <p className="result-desc">{error}</p>
          <div className="result-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleManualPaymentCheck}
            >
              🔄 Kiểm tra lại
            </button>
            <Link to="/my-bookings" className="btn btn-secondary">
              📋 Lịch sử đặt vé
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Derive booking ID from backend payment response (fallback to URL param only for links before load)
  const actualBookingId = payment?.bookingId || (urlBookingIdParam && /^[1-9]\d*$/.test(urlBookingIdParam) ? Number(urlBookingIdParam) : null);

  const movie = booking?.showtime?.movie;
  const cinema = booking?.showtime?.cinema;
  const room = booking?.showtime?.room;
  const showtime = booking?.showtime;
  const seats = booking?.seats || [];
  const combos = booking?.combos || [];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Phim', to: '/movies' },
          ...(actualBookingId
            ? [{ label: `Đặt vé #${actualBookingId}`, to: `/bookings/${actualBookingId}` }]
            : []),
          { label: 'Kết quả thanh toán VNPay' },
        ]}
      />

      <main className="container payment-result-page">
        {/* Sandbox Notice Banner */}
        <div className="vnpay-sandbox-pill">
          <span className="sandbox-badge">VNPAY SANDBOX</span>
          <span className="sandbox-text">Môi trường thử nghiệm cổng thanh toán điện tử VNPay</span>
        </div>

        {/* ── STATE A: PENDING (Đang chờ xác nhận thanh toán) ───────────── */}
        {payment?.status === 'PENDING' && (
          <div className="result-card pending-card">
            <div className="result-icon-badge pending">
              {isPolling ? <span className="pending-spin" /> : '⏳'}
            </div>

            <h1 className="result-title">Đang chờ xác nhận thanh toán</h1>

            <p className="result-desc">
              Hệ thống đang chờ kết quả xác nhận từ cổng VNPay. Thông báo thanh toán (IPN) có thể đến sau khi bạn quay lại trình duyệt.
            </p>

            {isPolling && (
              <div className="polling-indicator-box">
                <span className="pulse-dot" />
                <span>Đang tự động kiểm tra lại (lần {pollCount + 1})...</span>
              </div>
            )}

            {pollingTimedOut && (
              <div className="result-alert warning">
                <span className="alert-icon">⚠️</span>
                <div>
                  <strong>Chưa nhận được xác nhận từ VNPay</strong>
                  <p>
                    Thời gian kiểm tra tự động đã kết thúc nhưng giao dịch vẫn đang ở trạng thái chờ xử lý. Một giao dịch thành công có thể đang chờ xử lý IPN và đối soát. Bạn có thể bấm “Kiểm tra lại” hoặc xem chi tiết đơn đặt vé.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Details Box */}
            <div className="result-meta-box">
              <div className="meta-line">
                <span>Mã phiên thanh toán:</span>
                <code>#{payment.id}</code>
              </div>
              {actualBookingId && (
                <div className="meta-line">
                  <span>Mã đơn đặt vé:</span>
                  <strong>#{actualBookingId}</strong>
                </div>
              )}
              <div className="meta-line">
                <span>Số tiền giao dịch:</span>
                <span className="meta-price">{formatVND(payment.amount)}</span>
              </div>
              <div className="meta-line">
                <span>Trạng thái hiện tại:</span>
                <span className="payment-status-tag pending">Đang chờ xác nhận</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="result-actions-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleManualPaymentCheck}
                disabled={isCheckingPayment}
              >
                🔄 Kiểm tra lại
              </button>
              {actualBookingId && (
                <Link to={`/bookings/${actualBookingId}`} className="btn btn-secondary">
                  📄 Xem đơn đặt vé
                </Link>
              )}
              <Link to="/my-bookings" className="btn btn-secondary">
                📋 Lịch sử đặt vé
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE B: SUCCESS && reviewRequired === false (Thanh toán thành công) ── */}
        {payment?.status === 'SUCCESS' && !payment?.reviewRequired && (
          <div className="result-card success-card">
            <div className="result-icon-badge success">✓</div>

            <h1 className="result-title">Thanh toán thành công!</h1>

            <p className="result-desc">
              Giao dịch của bạn đã được cổng thanh toán VNPay xác nhận thành công.
            </p>

            {/* Transaction Details */}
            <div className="result-meta-box">
              <div className="meta-line">
                <span>Mã đơn đặt vé:</span>
                <strong>#{actualBookingId}</strong>
              </div>
              {payment.transactionId && (
                <div className="meta-line">
                  <span>Mã giao dịch VNPay:</span>
                  <code>{payment.transactionId}</code>
                </div>
              )}
              <div className="meta-line">
                <span>Số tiền thanh toán:</span>
                <span className="meta-price highlight-green">{formatVND(payment.amount)}</span>
              </div>
              <div className="meta-line">
                <span>Thời gian thanh toán:</span>
                <span>{formatDateTimeVN(payment.paidAt || payment.gatewayProcessedAt || payment.createdAt)}</span>
              </div>
            </div>

            {/* Booking & Movie Summary if available */}
            {booking && (
              <div className="result-booking-summary">
                <div className="result-movie-row">
                  {movie?.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="result-poster-img" />
                  ) : (
                    <div className="result-poster-placeholder">🎬</div>
                  )}
                  <div className="result-movie-info">
                    <h3 className="result-movie-title">
                      {movie?.ageRating && <AgeBadge rating={movie.ageRating} />} {movie?.title}
                    </h3>
                    <div className="result-info-text">
                      <span>Rạp:</span> <strong>{cinema?.name} ({cinema?.city})</strong>
                    </div>
                    <div className="result-info-text">
                      <span>Phòng:</span> <strong>{room?.name} {room?.type ? `(${room.type})` : ''}</strong>
                    </div>
                    <div className="result-info-text">
                      <span>Suất chiếu:</span> <strong>{formatDateTimeVN(showtime?.startTime)}</strong>
                    </div>
                    <div className="result-info-text">
                      <span>Ghế đã đặt:</span>{' '}
                      <strong>{seats.map((s) => s.seatLabel).join(', ')}</strong>
                    </div>
                    {combos.length > 0 && (
                      <div className="result-info-text">
                        <span>Combo:</span>{' '}
                        <span>{combos.map((c) => `${c.comboName} × ${c.quantity}`).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Electronic Ticket Issuance Box */}
            <div className="result-ticket-section">
              {ticketStatus === 'READY' && ticket ? (
                <div className="ticket-ready-box">
                  <div className="ticket-ready-header">
                    <span className="ticket-badge-pill">VÉ ĐIỆN TỬ ĐÃ PHÁT HÀNH</span>
                    <h4>Mã vé: #{ticket.id}</h4>
                  </div>

                  {ticketQrDataUrl && (
                    <div className="ticket-qr-container">
                      <img src={ticketQrDataUrl} alt="Mã QR vé" className="ticket-qr-image" />
                      <div className="ticket-qr-text">
                        <code>{ticket.qrCode}</code>
                      </div>
                    </div>
                  )}

                  <p className="ticket-instruction">
                    Xuất trình mã QR tại rạp để nhận vé xem phim.
                  </p>
                </div>
              ) : (
                <div className="ticket-issuing-box">
                  <div className="issuing-spinner-row">
                    <span className="issuing-spinner" />
                    <strong>Đang phát hành vé điện tử...</strong>
                  </div>
                  <p className="issuing-text">
                    Giao dịch thanh toán đã thành công. Hệ thống đang tự động tạo vé và mã QR cho bạn. Quá trình này có thể mất ít giây.
                  </p>
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleManualTicketRetry}
                    >
                      🔄 Thử lấy vé lại
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="result-actions-row">
              {actualBookingId && (
                <Link to={`/tickets/${actualBookingId}`} className="btn btn-primary">
                  🎟️ Xem vé điện tử & Mã QR
                </Link>
              )}
              {actualBookingId && (
                <Link to={`/bookings/${actualBookingId}`} className="btn btn-secondary">
                  📄 Chi tiết đơn đặt vé
                </Link>
              )}
              <Link to="/my-bookings" className="btn btn-secondary">
                📋 Lịch sử đặt vé
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE C: SUCCESS && reviewRequired === true (Cần đối soát) ──────── */}
        {payment?.status === 'SUCCESS' && payment?.reviewRequired && (
          <div className="result-card review-card">
            <div className="result-icon-badge review">⚠️</div>

            <h1 className="result-title">Thanh toán đã được ghi nhận</h1>
            <h2 className="result-subtitle-warning">Đơn đặt vé cần được kiểm tra</h2>

            {/* Detailed Vietnamese explanation for review reason */}
            <div className="result-alert review-alert">
              <span className="alert-icon">ℹ️</span>
              <div>
                <strong>Lý do cần đối soát:</strong>
                <p>{getReviewReasonMessage(payment.reviewReason)}</p>
              </div>
            </div>

            {/* Instructions to contact support */}
            <div className="review-support-card">
              <h4>Hướng dẫn hỗ trợ khách hàng:</h4>
              <p>
                Giao dịch thanh toán của bạn đã được ghi nhận trên cổng VNPay, tuy nhiên suất chiếu hoặc ghế ngồi cần được kiểm tra thêm để hoàn tất phát hành vé.
              </p>
              <p>
                Vui lòng liên hệ với bộ phận hỗ trợ khách hàng hoặc quầy vé tại rạp để được hỗ trợ xử lý đơn đặt vé này:
              </p>

              <div className="review-credentials-box">
                <div className="meta-line">
                  <span>Mã đơn đặt vé:</span>
                  <strong>#{actualBookingId}</strong>
                </div>
                {payment.transactionId && (
                  <div className="meta-line">
                    <span>Mã giao dịch VNPay:</span>
                    <code>{payment.transactionId}</code>
                  </div>
                )}
                <div className="meta-line">
                  <span>Mã phiên thanh toán:</span>
                  <code>#{payment.id}</code>
                </div>
                <div className="meta-line">
                  <span>Số tiền đã thanh toán:</span>
                  <span className="meta-price">{formatVND(payment.amount)}</span>
                </div>
                <div className="meta-line">
                  <span>Thời gian:</span>
                  <span>{formatDateTimeVN(payment.paidAt || payment.gatewayProcessedAt || payment.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Never allow re-payment of this booking */}
            <div className="result-actions-row">
              {actualBookingId && (
                <Link to={`/bookings/${actualBookingId}`} className="btn btn-primary">
                  📄 Xem chi tiết đơn đặt vé
                </Link>
              )}
              <Link to="/my-bookings" className="btn btn-secondary">
                📋 Lịch sử đặt vé
              </Link>
              <Link to="/" className="btn btn-secondary">
                🏠 Về trang chủ
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE D: FAILED (Thanh toán thất bại hoặc đã hủy) ─────────────── */}
        {payment?.status === 'FAILED' && (
          <div className="result-card failed-card">
            <div className="result-icon-badge failed">❌</div>

            <h1 className="result-title">Thanh toán không thành công</h1>

            <p className="result-desc">
              Giao dịch thanh toán qua cổng VNPay đã không thành công hoặc bạn đã hủy giao dịch trên cổng thanh toán.
            </p>

            {/* Failure details */}
            <div className="result-meta-box">
              <div className="meta-line">
                <span>Mã phiên thanh toán:</span>
                <code>#{payment.id}</code>
              </div>
              {actualBookingId && (
                <div className="meta-line">
                  <span>Mã đơn đặt vé:</span>
                  <strong>#{actualBookingId}</strong>
                </div>
              )}
              <div className="meta-line">
                <span>Số tiền:</span>
                <span>{formatVND(payment.amount)}</span>
              </div>
              <div className="meta-line">
                <span>Trạng thái:</span>
                <span className="payment-status-tag failed">Đã hủy / Thất bại</span>
              </div>
            </div>

            {/* Re-payment or Re-booking Decision based on booking status */}
            {booking && (
              <div className="failed-booking-resolution">
                {booking.status === 'PENDING' &&
                booking.heldUntil &&
                new Date(booking.heldUntil).getTime() > currentNow ? (
                  <div className="resolution-repay-box">
                    <p>
                      Ghế ngồi của bạn vẫn đang được giữ tạm thời. Bạn có thể thực hiện thanh toán lại trước khi hết thời gian giữ ghế.
                    </p>
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <Link to={`/checkout/${booking.id}`} className="btn btn-primary">
                        💳 Thanh toán lại đơn vé này
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="resolution-rebook-box">
                    <p style={{ color: '#f87171' }}>
                      Thời gian giữ ghế cho đơn đặt vé này đã kết thúc hoặc đơn đã bị hủy. Vui lòng chọn lại suất chiếu để đặt chỗ mới.
                    </p>
                    <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                )}
              </div>
            )}

            {/* Common Action Buttons */}
            <div className="result-actions-row">
              {actualBookingId && (
                <Link to={`/bookings/${actualBookingId}`} className="btn btn-secondary">
                  📄 Xem đơn đặt vé
                </Link>
              )}
              <Link to="/my-bookings" className="btn btn-secondary">
                📋 Lịch sử đặt vé
              </Link>
              <Link to="/" className="btn btn-secondary">
                🏠 Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
