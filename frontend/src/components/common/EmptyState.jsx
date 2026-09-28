export default function EmptyState({
  icon = '🎬',
  title = 'Không có dữ liệu',
  message = 'Hiện tại chưa có nội dung nào phù hợp để hiển thị.',
  actionText,
  onAction,
  minHeight = '240px',
}) {
  return (
    <div
      style={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        textAlign: 'center',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--bg-card)',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{icon}</div>
      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{title}</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: 0 }}>
        {message}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 'var(--space-2)' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
