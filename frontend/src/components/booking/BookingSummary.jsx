import { AgeBadge } from '../common/Badge';

function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateVN(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BookingSummary({
  showtimeDetail,
  selectedSeats = [],
  combos = [],
  selectedCombos = {},
  isSubmitting = false,
  onSubmit,
  serverError = null,
  isAuthenticated = false,
}) {
  const { movie, room, cinema } = showtimeDetail || {};

  // Tính tạm tính vé ghế
  const seatsSubtotal = selectedSeats.reduce(
    (sum, seat) => sum + (Number(seat.price) || 0),
    0
  );

  // Tính tạm tính combo
  const selectedComboList = Object.entries(selectedCombos)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([comboId, qty]) => {
      const combo = combos.find((c) => c.id === Number(comboId));
      return {
        id: Number(comboId),
        name: combo?.name || `Combo #${comboId}`,
        price: Number(combo?.price) || 0,
        quantity: Number(qty),
        subtotal: (Number(combo?.price) || 0) * Number(qty),
      };
    });

  const combosSubtotal = selectedComboList.reduce((sum, item) => sum + item.subtotal, 0);
  const estimatedTotalPrice = seatsSubtotal + combosSubtotal;

  const canSubmit = selectedSeats.length > 0 && !isSubmitting;

  return (
    <div className="booking-summary-sidebar">
      <h3 className="summary-heading">Thông tin đặt vé</h3>

      {/* Movie & Cinema Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          {movie?.ageRating && <AgeBadge rating={movie.ageRating} />}
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            {movie?.title}
          </strong>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {cinema?.name} • {room?.name}
        </div>
      </div>

      <div className="summary-item-row">
        <span>Suất chiếu:</span>
        <strong>
          {formatTime(showtimeDetail?.startTime)} ~ {formatTime(showtimeDetail?.endTime)}
        </strong>
      </div>

      <div className="summary-item-row">
        <span>Ngày chiếu:</span>
        <strong>{formatDateVN(showtimeDetail?.startTime)}</strong>
      </div>

      <div className="summary-item-row">
        <span>Định dạng:</span>
        <strong>2D {movie?.language || 'Phụ đề'}</strong>
      </div>

      {/* Seats List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Ghế đang chọn ({selectedSeats.length}/8):
          </span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {formatVND(seatsSubtotal)}
          </strong>
        </div>

        {selectedSeats.length > 0 ? (
          <div className="summary-seats-list">
            {selectedSeats.map((s) => (
              <span key={s.id} className="seat-tag">
                {s.label || `${s.row}${s.number}`} ({s.type})
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Vui lòng chọn ít nhất 1 ghế trên sơ đồ
          </span>
        )}
      </div>

      {/* Selected Combos List (if any) */}
      {selectedComboList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Combo bắp nước:</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatVND(combosSubtotal)}
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedComboList.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatVND(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Price Section */}
      <div className="summary-total-box">
        <div>
          <span className="summary-total-label">Tạm tính:</span>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            *Tổng tiền chính thức do hệ thống xác nhận
          </div>
        </div>
        <span className="summary-total-amount">{formatVND(estimatedTotalPrice)}</span>
      </div>

      {/* Error Message */}
      {serverError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            color: '#f87171',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          ⚠️ {serverError}
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        className="btn btn-primary btn-lg"
        disabled={!canSubmit}
        style={{ width: '100%', marginTop: 'var(--space-2)' }}
        onClick={onSubmit}
      >
        {isSubmitting
          ? 'Đang tạo đơn đặt vé...'
          : !isAuthenticated
            ? 'Đăng nhập để đặt vé'
            : 'Xác nhận tạo đơn đặt vé'}
      </button>

      {!isAuthenticated && selectedSeats.length > 0 && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            display: 'block',
          }}
        >
          Lựa chọn ghế và combo của bạn sẽ được lưu lại khi đăng nhập.
        </span>
      )}
    </div>
  );
}
