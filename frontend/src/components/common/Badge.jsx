export function AgeBadge({ rating, className = '' }) {
  if (!rating) return null;

  // Map backend ratings ('P', 'K', 'T13', 'T16', 'T18')
  const ratingMap = {
    P: { label: 'P', color: '#10B981', title: 'Phù hợp mọi lứa tuổi' },
    K: { label: 'K', color: '#3B82F6', title: 'Khán giả dưới 13 tuổi xem cùng người lớn' },
    T13: { label: '13+', color: '#F59E0B', title: 'Phim dành cho khán giả từ 13 tuổi trở lên' },
    T16: { label: '16+', color: '#F97316', title: 'Phim dành cho khán giả từ 16 tuổi trở lên' },
    T18: { label: '18+', color: '#E53935', title: 'Phim dành cho khán giả từ 18 tuổi trở lên' },
  };

  const item = ratingMap[rating] || { label: rating, color: '#E53935', title: rating };

  return (
    <span
      className={`age-badge ${className}`}
      title={item.title}
      style={{
        backgroundColor: item.color,
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize: '0.75rem',
        padding: '2px 6px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        letterSpacing: '0.5px',
      }}
    >
      {item.label}
    </span>
  );
}

export function FormatBadge({ format = '2D Phụ đề', className = '' }) {
  return (
    <span
      className={`format-badge ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-default)',
        fontSize: '0.75rem',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {format}
    </span>
  );
}
