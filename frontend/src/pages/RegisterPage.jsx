import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import useAuth from '../context/useAuth';
import authService from '../services/authService';
import './LoginPage.css';

function getSafeReturnUrl(target) {
  if (!target || typeof target !== 'string') return '/';
  if (target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return '/';
}

export default function RegisterPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const queryReturnUrl = searchParams.get('returnUrl');
  const returnUrl = getSafeReturnUrl(queryReturnUrl || '/');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & status states
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect away
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, returnUrl]);

  const validate = () => {
    const errors = {};

    // Backend rule: name.trim().length >= 2
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên.';
    } else if (name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    // Backend rule: Valid email format via Email VO
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Địa chỉ email không hợp lệ.';
    }

    // Backend rule: password.length >= 6
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    // Frontend validation: confirmPassword must match password
    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
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
      // Backend POST /auth/signUp only expects { name, email, password }
      // Do NOT send confirmPassword to backend!
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Backend returns { success: true, data: user } without access token.
      // Redirect to /login with pre-filled state and success notification.
      navigate('/login', {
        state: {
          message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.',
          returnUrl,
        },
      });
    } catch (err) {
      // Specific handling for 409 Conflict (Email taken) and 422 Unprocessable Entity
      if (err.status === 409) {
        setServerError('Email này đã được sử dụng. Vui lòng chọn một email khác hoặc đăng nhập.');
      } else {
        setServerError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Đăng Ký Tài Khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản để đặt vé và nhận ưu đãi từ CineBooking</p>
        </div>

        {serverError && (
          <div className="auth-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">
              Họ và tên <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="reg-name"
                type="text"
                className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: null }));
                  }
                }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {fieldErrors.name && (
              <span className="field-error-text">{fieldErrors.name}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">
              Địa chỉ Email <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="reg-email"
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
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error-text">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              Mật khẩu <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: null }));
                  }
                }}
                disabled={isSubmitting}
                autoComplete="new-password"
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

          {/* Confirm Password (Frontend check only) */}
          <div className="form-group">
            <label htmlFor="reg-confirm-password" className="form-label">
              Xác nhận mật khẩu <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }
                }}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="field-error-text">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Đã có tài khoản?</span>
          <Link
            to={`/login${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            className="auth-link"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </main>
  );
}
