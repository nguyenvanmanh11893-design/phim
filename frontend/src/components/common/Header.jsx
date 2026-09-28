import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import useAuth from '../../context/useAuth';
import './Header.css';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="header-wrapper">
      <div className="container">
        <div className="header-inner">
          {/* Logo / Brand */}
          <Link to="/" className="header-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
              </svg>
            </div>
            <div className="brand-text-group">
              <div className="brand-title">
                Cine<span>Booking</span>
              </div>
              <div className="brand-tagline">Đặt vé nhanh • Chuẩn rạp</div>
            </div>
          </Link>

          {/* Center Navigation per yeucau.txt: Trang chủ, Phim, Rạp chiếu */}
          <nav className="header-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Phim
            </NavLink>
            <NavLink
              to="/cinemas"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Rạp chiếu
            </NavLink>
          </nav>

          {/* Right Actions: Auth or User Dropdown */}
          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar" style={{ overflow: 'hidden' }}>
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.name || 'Avatar'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : user?.name ? (
                      user.name.charAt(0).toUpperCase()
                    ) : (
                      'U'
                    )}
                  </div>
                  <span className="user-name">{user?.name || 'Tài khoản'}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▾</span>
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span>Tài khoản</span>
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span>Vé của tôi</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                        style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                      >
                        <span>Trang Quản trị</span>
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleLogout}
                      style={{ color: 'var(--status-error)' }}
                    >
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons-desktop">
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-drawer">
            <NavLink
              to="/"
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              end
            >
              🏠 Trang chủ
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              🎬 Phim
            </NavLink>
            <NavLink
              to="/cinemas"
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              🏢 Rạp chiếu
            </NavLink>

            <div className="mobile-auth-section">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tài khoản ({user?.name})
                  </Link>
                  <Link
                    to="/my-bookings"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vé của tôi
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="mobile-nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                    >
                      Trang Quản trị
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mobile-nav-link"
                    onClick={handleLogout}
                    style={{ color: 'var(--status-error)', textAlign: 'left', background: 'none', border: 'none' }}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px', padding: '0 8px' }}>
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
