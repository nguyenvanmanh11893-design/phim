import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router';
import useAuth from '../context/useAuth';
import ErrorBoundary from '../components/common/ErrorBoundary';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: '📊', end: true },
  { to: '/admin/movies', label: 'Quản lý Phim', icon: '🎬' },
  { to: '/admin/cinemas', label: 'Rạp & Phòng chiếu', icon: '🏢' },
  { to: '/admin/showtimes', label: 'Suất chiếu', icon: '🕒' },
  { to: '/admin/combos', label: 'Combo bắp nước', icon: '🍿' },
  { to: '/admin/bookings', label: 'Quản lý Đặt vé', icon: '🎟️' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/reports', label: 'Báo cáo doanh thu', icon: '📈' },
  { to: '/admin/ratings', label: 'Đánh giá phim', icon: '⭐' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    // Scroll to top of content on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Derive current page title from path
  const currentNav = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const pageTitle = currentNav?.label || 'Quản trị hệ thống';

  return (
    <div className="admin-root">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <Link to="/admin" className="admin-brand-link">
            <span className="brand-icon">🎬</span>
            <div className="brand-text">
              <span className="brand-name">CineBooking</span>
              <span className="brand-role-tag">ADMIN PORTAL</span>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="sidebar-website-link">
            <span>🌐</span>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu quản trị"
            >
              ☰
            </button>
            <h1 className="topbar-page-title">{pageTitle}</h1>
          </div>

          <div className="topbar-right">
            <div className="admin-user-pill">
              <div className="admin-user-avatar">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name || 'Admin'} />
                ) : user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  'A'
                )}
              </div>
              <div className="admin-user-meta">
                <span className="admin-user-name">{user?.name || 'Admin'}</span>
                <span className="admin-badge">Quản trị viên</span>
              </div>
            </div>

            <Link to="/" className="btn btn-secondary btn-sm topbar-btn-site">
              ← Website
            </Link>

            <button
              type="button"
              className="btn btn-secondary btn-sm topbar-btn-logout"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content-container">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
