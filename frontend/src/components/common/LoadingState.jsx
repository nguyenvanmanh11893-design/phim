export function Spinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 20,
    md: 36,
    lg: 54,
  };
  const px = sizeMap[size] || 36;

  return (
    <div
      className={`spinner ${className}`}
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

export function LoadingSection({ text = 'Đang tải dữ liệu...', minHeight = '280px' }) {
  return (
    <div
      style={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        color: 'var(--text-secondary)',
        padding: 'var(--space-8) 0',
      }}
    >
      <Spinner size="md" />
      <span style={{ fontSize: '0.95rem' }}>{text}</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        height: '100%',
        animation: 'pulse 1.5s infinite ease-in-out',
      }}
    >
      <div style={{ aspectRatio: '2/3', backgroundColor: 'var(--bg-surface)' }} />
      <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ height: '18px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', width: '80%' }} />
        <div style={{ height: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', width: '50%' }} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LoadingSection;
