function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export default function SeatMap({ seatMap, selectedSeats, onToggleSeat, maxSeats = 8 }) {
  const sortedRowKeys = Object.keys(seatMap || {}).sort();

  return (
    <div className="seat-selection-card">
      {/* Screen visual */}
      <div className="screen-visual-box">
        <div className="screen-curve-bar" />
        <span className="screen-label">MÀN HÌNH</span>
      </div>

      {/* Seat Rows Grid */}
      <div className="seat-map-wrapper" role="region" aria-label="Sơ đồ ghế ngồi">
        {sortedRowKeys.map((rowKey) => {
          const rowSeats = seatMap[rowKey] || [];
          return (
            <div key={rowKey} className="seat-row" role="row">
              <span className="seat-row-label" aria-hidden="true">
                {rowKey}
              </span>

              {rowSeats.map((seat) => {
                const isSelected = selectedSeats.some((s) => s.id === seat.id);
                const isOccupied = seat.status === 'OCCUPIED';
                const isUnavailable = seat.status === 'UNAVAILABLE';
                const isDisabled = isOccupied || isUnavailable;

                let typeClass = 'seat-normal';
                if (seat.type === 'VIP') typeClass = 'seat-vip';
                if (seat.type === 'COUPLE') typeClass = 'seat-couple';
                if (isDisabled) typeClass = 'seat-occupied';
                if (isSelected) typeClass = 'seat-selected';

                const seatLabel = seat.label || `${seat.row}${seat.number}`;
                const seatStatusText = isSelected
                  ? 'Đang chọn'
                  : isOccupied
                    ? 'Đã đặt'
                    : isUnavailable
                      ? 'Không khả dụng'
                      : 'Có thể chọn';

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={isDisabled}
                    className={`seat-btn ${typeClass}`}
                    onClick={() => onToggleSeat(seat)}
                    aria-label={`Ghế ${seatLabel}, loại ${seat.type}, giá ${formatVND(seat.price)}, trạng thái: ${seatStatusText}`}
                    title={`${seatLabel} (${seat.type}) - ${formatVND(seat.price)} [${seatStatusText}]`}
                  >
                    {seatLabel}
                  </button>
                );
              })}

              <span className="seat-row-label" aria-hidden="true">
                {rowKey}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="seat-legend-box">
        <div className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: '#1F2430', border: '1px solid #374151' }}
          />
          <span>Đã đặt / Kín</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span>Ghế bạn chọn</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: '#2E374D', border: '1px solid #3B4663' }}
          />
          <span>Ghế thường</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)', border: '1px solid #EF4444' }}
          />
          <span>Ghế VIP</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: 'rgba(236, 72, 153, 0.4)', border: '1px solid #EC4899' }}
          />
          <span>Ghế Sweetbox</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 'var(--space-3)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        Lưu ý: Bạn có thể chọn từ 1 đến tối đa {maxSeats} ghế cho mỗi lần đặt vé.
      </div>
    </div>
  );
}
