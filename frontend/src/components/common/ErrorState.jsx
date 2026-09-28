export default function ErrorState({
  message = 'Đã có lỗi xảy ra khi tải dữ liệu.',
  onRetry,
  minHeight = '280px',
}) {
  return (
    <div
      style={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        textAlign: 'center',
        padding: 'var(--space-6)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 'var(--radius-lg)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
      >
        ⚠️
      </div>

      <div>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Không thể tải dữ liệu
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px' }}>
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary btn-sm"
          style={{ marginTop: 'var(--space-2)' }}
        >
          🔄 Thử lại
        </button>
      )}
    </div>
  );
}
