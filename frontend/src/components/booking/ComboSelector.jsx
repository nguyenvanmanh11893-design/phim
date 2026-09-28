function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export default function ComboSelector({
  combos = [],
  selectedCombos = {},
  onQuantityChange,
  loading = false,
  error = null,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="combo-card-container">
        <h3 className="combo-section-title">🍿 Bắp & Nước (Tùy chọn)</h3>
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>
          Đang tải danh sách combo bắp nước...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="combo-card-container">
        <h3 className="combo-section-title">🍿 Bắp & Nước (Tùy chọn)</h3>
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            color: '#f87171',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span>⚠️ {error}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onRetry && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onRetry}
              >
                Thử lại
              </button>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              (Bạn vẫn có thể tiếp tục đặt vé mà không cần combo)
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div className="combo-card-container">
        <h3 className="combo-section-title">🍿 Bắp & Nước (Tùy chọn)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
          Hiện chưa có combo bắp nước nào khả dụng cho suất chiếu này. Bạn vẫn có thể tiếp tục đặt vé ghế ngồi.
        </p>
      </div>
    );
  }

  return (
    <div className="combo-card-container">
      <div className="combo-section-header">
        <h3 className="combo-section-title">🍿 Bắp & Nước Uống</h3>
        <span className="combo-section-subtitle">
          Chọn thêm combo để trải nghiệm xem phim trọn vẹn hơn
        </span>
      </div>

      <div className="combo-grid">
        {combos.map((combo) => {
          const qty = selectedCombos[combo.id] || 0;

          return (
            <div
              key={combo.id}
              className={`combo-item-card ${qty > 0 ? 'selected' : ''}`}
            >
              <div className="combo-image-wrapper">
                {combo.imageUrl ? (
                  <img
                    src={combo.imageUrl}
                    alt={combo.name}
                    className="combo-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="combo-img-fallback"
                  style={{ display: combo.imageUrl ? 'none' : 'flex' }}
                >
                  🍿
                </div>
              </div>

              <div className="combo-details">
                <h4 className="combo-name">{combo.name}</h4>
                <p className="combo-desc">{combo.description || 'Combo bắp rang & nước giải khát thơm ngon'}</p>
                <div className="combo-price-row">
                  <span className="combo-price">{formatVND(combo.price)}</span>

                  <div className="combo-quantity-control">
                    <button
                      type="button"
                      className="qty-btn"
                      disabled={qty <= 0}
                      onClick={() => onQuantityChange(combo.id, Math.max(0, qty - 1))}
                      aria-label={`Giảm số lượng ${combo.name}`}
                    >
                      −
                    </button>
                    <span className="qty-number" aria-label={`Số lượng: ${qty}`}>
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => onQuantityChange(combo.id, qty + 1)}
                      aria-label={`Tăng số lượng ${combo.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
