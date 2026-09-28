import { Link } from 'react-router';
import useAuth from '../context/useAuth';
import './ForbiddenPage.css';

export default function ForbiddenPage() {
  const { user, logout } = useAuth();

  return (
    <main className="container forbidden-page">
      <div className="forbidden-card">
        <div className="forbidden-icon">🚫</div>
        <span className="forbidden-badge">403 FORBIDDEN</span>
        <h1 className="forbidden-title">Không có quyền truy cập</h1>
        <p className="forbidden-text">
          Tài khoản <strong>{user?.email || 'của bạn'}</strong> hiện mang vai trò{' '}
          <strong style={{ textTransform: 'uppercase', color: 'var(--color-primary)' }}>
            {user?.role || 'user'}
          </strong>
          , không đủ thẩm quyền để truy cập vào khu vực quản trị <strong>CineBooking Admin</strong>.
        </p>

        <div className="forbidden-actions">
          <Link to="/" className="btn btn-primary">
            🏠 Quay về trang chủ
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => logout()}
          >
            Đăng xuất / Đổi tài khoản
          </button>
        </div>
      </div>
    </main>
  );
}
