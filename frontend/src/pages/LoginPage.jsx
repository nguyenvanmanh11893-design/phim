import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import useAuth from '../context/useAuth';
import './LoginPage.css';

/**
 * Validates and sanitizes return URL to avoid open-redirect vulnerabilities.
 * Only allows relative internal paths (starting with / but NOT //).
 */
function getSafeReturnUrl(target) {
  if (!target || typeof target !== 'string') return '/';
  if (target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return '/';
}

export default function LoginPage() {
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract return URL from location state or search params
  const stateFrom = location.state?.from?.pathname;
  const searchParams = new URLSearchParams(location.search);
  const queryReturnUrl = searchParams.get('returnUrl');
  const returnUrl = getSafeReturnUrl(stateFrom || queryReturnUrl || '/');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & status states
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, returnUrl]);

  // Read message passed from registration page if any
  const registrationSuccessMessage = location.state?.message;

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });

      // Successful login updates AuthContext user and header immediately
      navigate(returnUrl, { replace: true });
    } catch (err) {
      setServerError(
        err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Đăng Nhập</h1>
          <p className="auth-subtitle">Chào mừng bạn quay lại CineBooking</p>
        </div>

        {registrationSuccessMessage && (
          <div className="auth-alert-success" style={{ marginBottom: 'var(--space-4)' }}>
            <span>✅</span>
            <span>{registrationSuccessMessage}</span>
          </div>
        )}

        {serverError && (
          <div className="auth-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Địa chỉ Email <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="login-email"
                type="email"
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error-text">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Mật khẩu <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: null }));
                  }
                }}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="field-error-text">{fieldErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Chưa có tài khoản?</span>
          <Link
            to={`/register${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            className="auth-link"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </main>
  );
}
