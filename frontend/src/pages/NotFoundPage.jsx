import { Link } from 'react-router';
import EmptyState from '../components/common/EmptyState';

export default function NotFoundPage() {
  return (
    <main className="container" style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
      <EmptyState
        icon="🔍"
        title="404 - Không tìm thấy trang"
        message="Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đi."
      />
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/" className="btn btn-primary">
          ← Trở về Trang chủ
        </Link>
      </div>
    </main>
  );
}
