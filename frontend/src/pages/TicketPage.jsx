import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import QRCode from 'qrcode';
import bookingService from '../services/bookingService';
import ticketService from '../services/ticketService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { AgeBadge } from '../components/common/Badge';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import './TicketPage.css';

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

export default function TicketPage() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Client-side QR Code Data URL
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadTicketData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both booking and ticket in parallel
        const [bookingData, ticketData] = await Promise.all([
          bookingService.getBookingById(bookingId),
          ticketService.getTicketByBookingId(bookingId),
        ]);

        if (ignore) return;

        setBooking(bookingData);
        setTicket(ticketData);

        // Render QR Code from ticket.qrCode
        if (ticketData?.qrCode) {
          try {
            const url = await QRCode.toDataURL(ticketData.qrCode, {
              width: 240,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
            });
            if (!ignore) {
              setQrDataUrl(url);
              setQrError(false);
            }
          } catch (qrErr) {
            console.error('Failed to generate QR:', qrErr);
            if (!ignore) {
              setQrError(true);
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải thông tin vé điện tử.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTicketData();

    return () => {
      ignore = true;
    };
  }, [bookingId, reloadKey]);

  const handlePrint = () => {
    window.print();
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <main className="container ticket-page">
        <LoadingSection text="Đang tạo mã QR và tải vé điện tử..." minHeight="420px" />
      </main>
    );
  }

  if (error || !ticket || !booking) {
    return (
      <main className="container ticket-page">
        <ErrorState
          message={error || 'Không tìm thấy vé điện tử cho đơn đặt vé này.'}
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

  const { showtime, seats = [], combos = [] } = booking;
  const movie = showtime?.movie;
  const cinema = showtime?.cinema;
  const room = showtime?.room;

  return (
    <>
      <div className="no-print">
        <Breadcrumbs
          items={[
            { label: 'Phim', to: '/movies' },
            { label: `Đặt vé #${booking.id}`, to: `/bookings/${booking.id}` },
            { label: 'Vé điện tử' },
          ]}
        />
      </div>

      <main className="container ticket-page">
        {/* Ticket Outer Wrapper */}
        <div className="ticket-printable-container">
          {/* Top Banner / Cinema Header */}
          <div className="ticket-cinema-header">
            <div className="ticket-brand">
              <div>
                <span className="brand-name">CINEBOOKING</span>
                <span className="brand-sub">VÉ ĐIỆN TỬ CHÍNH THỨC</span>
              </div>
            </div>
            <div className="ticket-status-pill">
              {ticket.isUsed ? (
                <span className="pill-used">ĐÃ SỬ DỤNG</span>
              ) : (
                <span className="pill-active">VÉ HỢP LỆ</span>
              )}
            </div>
          </div>

          <div className="ticket-body">
            {/* Left Section: QR Code & Validation Instructions */}
            <div className="ticket-qr-section">
              <div className="ticket-qr-card">
                {qrDataUrl && !qrError ? (
                  <img
                    src={qrDataUrl}
                    alt={`Mã QR vé: ${ticket.qrCode}`}
                    className="ticket-qr-image"
                  />
                ) : (
                  <div className="ticket-qr-fallback">
                    <span style={{ fontSize: '2rem' }}>📱</span>
                    <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                      Mã xác thực vé:
                    </span>
                  </div>
                )}
                <div className="ticket-qr-code-string">
                  <code>{ticket.qrCode}</code>
                </div>
              </div>

              <div className="ticket-qr-instruction">
                <p>Xuất trình mã QR này tại quầy soát vé để vào rạp.</p>
                <div className="ticket-issued-time">
                  Phát hành: {formatDateTimeVN(ticket.issuedAt)}
                </div>
                {ticket.isUsed && ticket.usedAt && (
                  <div className="ticket-used-time">
                    Đã soát vé lúc: {formatDateTimeVN(ticket.usedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Movie & Booking Details */}
            <div className="ticket-info-section">
              <div className="ticket-movie-header">
                <h2 className="ticket-movie-title">
                  {movie?.ageRating && <AgeBadge rating={movie.ageRating} />}{' '}
                  {movie?.title}
                </h2>
                <div className="ticket-booking-ref">
                  Mã vé: <strong>#{ticket.id}</strong> | Đơn hàng: <strong>#{booking.id}</strong>
                </div>
              </div>

              <div className="ticket-grid-details">
                <div className="ticket-detail-item">
                  <span className="ticket-label">RẠP CHIẾU</span>
                  <span className="ticket-value highlight">{cinema?.name}</span>
                  <span className="ticket-subvalue">{cinema?.address || cinema?.city}</span>
                </div>

                <div className="ticket-detail-item">
                  <span className="ticket-label">PHÒNG CHIẾU</span>
                  <span className="ticket-value highlight">
                    {room?.name} {room?.type ? `(${room.type})` : ''}
                  </span>
                </div>

                <div className="ticket-detail-item">
                  <span className="ticket-label">SUẤT CHIẾU</span>
                  <span className="ticket-value highlight">
                    {formatDateTimeVN(showtime?.startTime)}
                  </span>
                </div>

                <div className="ticket-detail-item">
                  <span className="ticket-label">GHẾ ĐÃ CHỌN</span>
                  <span className="ticket-value highlight seats-highlight">
                    {seats.map((s) => s.seatLabel).join(', ')}
                  </span>
                </div>
              </div>

              {/* Combos list if any */}
              {combos.length > 0 && (
                <div className="ticket-combos-summary">
                  <span className="ticket-label">COMBO BẮP NƯỚC:</span>
                  <div className="ticket-combo-pills">
                    {combos.map((c) => (
                      <span key={c.id || c.comboId} className="combo-pill">
                        🍿 {c.comboName} × {c.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Total */}
              <div className="ticket-footer-total">
                <div>
                  <span className="ticket-label">TỔNG TIỀN ĐÃ THANH TOÁN</span>
                  <div className="ticket-paid-note">Đã thanh toán (MOCK SANDBOX)</div>
                </div>
                <span className="ticket-total-price">{formatVND(booking.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Ticket Security Watermark */}
          <div className="ticket-bottom-bar">
            <span>Vui lòng đến trước giờ chiếu 15 phút để đảm bảo trải nghiệm tốt nhất.</span>
            <span>CineBooking Electronic Pass</span>
          </div>
        </div>

        {/* Action Controls (Hidden during print) */}
        <div className="ticket-actions no-print">
          <button
            type="button"
            className="btn btn-primary ticket-print-btn"
            onClick={handlePrint}
          >
            🖨️ In vé / Lưu PDF
          </button>

          <Link to="/my-bookings" className="btn btn-secondary">
            📋 Lịch sử đặt vé
          </Link>

          <Link to="/movies" className="btn btn-secondary">
            🎬 Tiếp tục xem phim
          </Link>
        </div>
      </main>
    </>
  );
}
