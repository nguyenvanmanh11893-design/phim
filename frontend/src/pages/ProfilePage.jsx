import { useState, useEffect, useRef } from 'react';
import useAuth from '../context/useAuth';
import userService from '../services/userService';
import uploadService from '../services/uploadService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { toLocalDateString } from '../utils/formatters';
import './ProfilePage.css';
import './LoginPage.css';

export default function ProfilePage() {
  const { updateUser } = useAuth();

  // Profile data fetching state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Profile Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileServerError, setProfileServerError] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Avatar Upload states
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  // Password Form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordServerError, setPasswordServerError] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Clean up preview object URL on unmount or replace
  const cleanupPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupPreview();
    };
  }, []);

  // Load latest profile from backend GET /users/me
  useEffect(() => {
    let ignore = false;

    async function fetchMe() {
      try {
        const data = await userService.getProfile();
        if (ignore) return;
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setDateOfBirth(data.dateOfBirth ? toLocalDateString(new Date(data.dateOfBirth)) : '');
        setFetchError(null);
      } catch (err) {
        if (!ignore) {
          setFetchError(err.message || 'Không thể tải thông tin hồ sơ.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchMe();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Avatar upload handler: Chọn file -> POST /upload/avatar -> PATCH /users/me -> Sync AuthContext
  const handleAvatarClick = () => {
    if (isUploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAvatarClick();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');

    // Kiểm tra định dạng file (JPEG, PNG, WEBP)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;
    if (!validMimes.includes(file.type) && !validExtensions.test(file.name)) {
      setAvatarError('Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG hoặc WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAvatarError('Kích thước file ảnh quá lớn (tối đa 5MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Tạo preview URL tạm thời
    cleanupPreview();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setAvatarPreview(objectUrl);
    setIsUploadingAvatar(true);

    try {
      // 1. Upload ảnh lên Cloudinary qua POST /upload/avatar
      const uploadRes = await uploadService.uploadAvatar(file);
      const newAvatarUrl = uploadRes?.url || uploadRes?.data?.url;

      if (!newAvatarUrl) {
        throw new Error('Không nhận được URL ảnh đại diện từ server');
      }

      // 2. Cập nhật avatarUrl vào profile qua PATCH /users/me
      const updatedUser = await userService.updateProfile({ avatarUrl: newAvatarUrl });

      // 3. Cập nhật state trang và đồng bộ AuthContext để Header cập nhật ngay
      setProfile(updatedUser);
      updateUser(updatedUser);
      setAvatarSuccess('Cập nhật ảnh đại diện thành công!');
      setAvatarPreview(null);
      cleanupPreview();
    } catch (err) {
      // Khi thất bại: giữ lại avatar cũ đã lưu trước đó và hiển thị lỗi
      setAvatarPreview(null);
      cleanupPreview();
      setAvatarError(err.message || 'Tải ảnh đại diện thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Profile Update: PATCH /users/me (chỉ cập nhật name, phone, dateOfBirth - không ghi đè avatarUrl)
  const validateProfile = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Họ và tên không được để trống.';
    } else if (name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (phone.trim() && !/^\+?[\d\s\-()]{7,20}$/.test(phone.trim())) {
      errors.phone = 'Số điện thoại không đúng định dạng (7 - 20 số).';
    }

    if (dateOfBirth) {
      const selected = new Date(dateOfBirth);
      const today = new Date();
      if (isNaN(selected.getTime())) {
        errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
      } else if (selected > today) {
        errors.dateOfBirth = 'Ngày sinh không được là ngày trong tương lai.';
      }
    }

    setProfileFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileServerError('');
    setProfileSuccessMsg('');

    if (!validateProfile()) return;

    setIsUpdatingProfile(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
      };

      const updatedUser = await userService.updateProfile(payload);
      setProfile(updatedUser);

      // Đồng bộ với AuthContext
      updateUser(updatedUser);

      setProfileSuccessMsg('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      setProfileServerError(err.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Change Password: PATCH /users/me/password
  const validatePassword = () => {
    const errors = {};
    if (!oldPassword) {
      errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    } else if (newPassword === oldPassword) {
      errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (confirmNewPassword !== newPassword) {
      errors.confirmNewPassword = 'Xác nhận mật khẩu mới không khớp.';
    }

    setPasswordFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordServerError('');
    setPasswordSuccessMsg('');

    if (!validatePassword()) return;

    setIsChangingPassword(true);
    try {
      // Backend expects: { oldPassword, newPassword }
      await userService.changePassword({
        oldPassword,
        newPassword,
      });

      setPasswordSuccessMsg('Đổi mật khẩu thành công!');
      // Reset sensitive password fields from form state
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordFieldErrors({});
    } catch (err) {
      if (err.status === 401) {
        setPasswordServerError('Mật khẩu hiện tại không chính xác.');
      } else {
        setPasswordServerError(err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="container profile-page">
        <LoadingSection text="Đang tải thông tin tài khoản..." minHeight="360px" />
      </main>
    );
  }

  if (fetchError || !profile) {
    return (
      <main className="container profile-page">
        <ErrorState
          message={fetchError || 'Không thể tải thông tin hồ sơ.'}
          onRetry={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
          minHeight="320px"
        />
      </main>
    );
  }

  const userAvatarInitial = profile.name ? profile.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <Breadcrumbs items={[{ label: 'Tài khoản cá nhân' }]} />

      <main className="container profile-page">
        {/* Header Overview Card */}
        <div className="profile-header-card">
          {/* Hidden File Input for Avatar Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-hidden="true"
          />

          {/* Interactive Avatar Button */}
          <button
            type="button"
            className={`profile-avatar-btn ${isUploadingAvatar ? 'uploading' : ''}`}
            onClick={handleAvatarClick}
            onKeyDown={handleAvatarKeyDown}
            disabled={isUploadingAvatar}
            aria-label="Đổi ảnh đại diện"
            title="Bấm để đổi ảnh đại diện (JPG, PNG, WEBP, tối đa 5MB)"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Xem trước avatar" />
            ) : profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} />
            ) : (
              <span>{userAvatarInitial}</span>
            )}

            <div className="profile-avatar-overlay">
              {isUploadingAvatar ? (
                <div className="avatar-upload-spinner" />
              ) : (
                <>
                  <span className="profile-avatar-overlay-icon">📷</span>
                  <span>Đổi ảnh</span>
                </>
              )}
            </div>
          </button>

          <div className="profile-header-info">
            <h1 className="profile-header-name">{profile.name}</h1>
            <span className="profile-header-email">{profile.email}</span>
            <div>
              <span
                className={`profile-badge-role ${profile.role === 'admin' ? 'admin' : 'user'}`}
              >
                {profile.role === 'admin' ? '👑 Quản trị viên' : '🎬 Thành viên'}
              </span>
            </div>

            {/* Avatar Upload Feedback */}
            {avatarSuccess && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#4ade80',
                  marginTop: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>✅</span>
                <span>{avatarSuccess}</span>
              </div>
            )}
            {avatarError && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#f87171',
                  marginTop: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>⚠️</span>
                <span>{avatarError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Profile Update & Password Change */}
        <div className="profile-grid">
          {/* 1. Profile Information Form */}
          <div className="profile-card">
            <h2 className="profile-card-title">
              <span>👤</span>
              <span>Thông Tin Cá Nhân</span>
            </h2>

            {profileSuccessMsg && (
              <div className="auth-alert-success">
                <span>✅</span>
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileServerError && (
              <div className="auth-alert-error">
                <span>⚠️</span>
                <span>{profileServerError}</span>
              </div>
            )}

            <form className="profile-form" onSubmit={handleUpdateProfile} noValidate>
              {/* Email (Read-only) */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profile.email}
                  disabled
                  readOnly
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
                <span className="form-help-text">
                  Địa chỉ email được liên kết cố định với tài khoản này.
                </span>
              </div>

              {/* Name */}
              <div className="form-group">
                <label htmlFor="profile-name" className="form-label">
                  Họ và tên <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className={`form-input ${profileFieldErrors.name ? 'error' : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (profileFieldErrors.name) {
                      setProfileFieldErrors((prev) => ({ ...prev, name: null }));
                    }
                  }}
                  disabled={isUpdatingProfile}
                />
                {profileFieldErrors.name && (
                  <span className="field-error-text">{profileFieldErrors.name}</span>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="profile-phone" className="form-label">
                  Số điện thoại
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className={`form-input ${profileFieldErrors.phone ? 'error' : ''}`}
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (profileFieldErrors.phone) {
                      setProfileFieldErrors((prev) => ({ ...prev, phone: null }));
                    }
                  }}
                  disabled={isUpdatingProfile}
                />
                {profileFieldErrors.phone && (
                  <span className="field-error-text">{profileFieldErrors.phone}</span>
                )}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label htmlFor="profile-dob" className="form-label">
                  Ngày sinh
                </label>
                <input
                  id="profile-dob"
                  type="date"
                  className={`form-input ${profileFieldErrors.dateOfBirth ? 'error' : ''}`}
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (profileFieldErrors.dateOfBirth) {
                      setProfileFieldErrors((prev) => ({ ...prev, dateOfBirth: null }));
                    }
                  }}
                  disabled={isUpdatingProfile}
                  max={toLocalDateString(new Date())}
                />
                {profileFieldErrors.dateOfBirth && (
                  <span className="field-error-text">{profileFieldErrors.dateOfBirth}</span>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdatingProfile}
                style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
              >
                {isUpdatingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </form>
          </div>

          {/* 2. Change Password Form */}
          <div className="profile-card">
            <h2 className="profile-card-title">
              <span>🔒</span>
              <span>Đổi Mật Khẩu</span>
            </h2>

            {passwordSuccessMsg && (
              <div className="auth-alert-success">
                <span>✅</span>
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordServerError && (
              <div className="auth-alert-error">
                <span>⚠️</span>
                <span>{passwordServerError}</span>
              </div>
            )}

            <form className="profile-form" onSubmit={handleChangePassword} noValidate>
              {/* Old Password */}
              <div className="form-group">
                <label htmlFor="old-password" className="form-label">
                  Mật khẩu hiện tại <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="old-password"
                    type={showOldPassword ? 'text' : 'password'}
                    className={`form-input ${passwordFieldErrors.oldPassword ? 'error' : ''}`}
                    placeholder="Nhập mật khẩu hiện tại"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      if (passwordFieldErrors.oldPassword) {
                        setPasswordFieldErrors((prev) => ({ ...prev, oldPassword: null }));
                      }
                    }}
                    disabled={isChangingPassword}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {showOldPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordFieldErrors.oldPassword && (
                  <span className="field-error-text">
                    {passwordFieldErrors.oldPassword}
                  </span>
                )}
              </div>

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="new-password" className="form-label">
                  Mật khẩu mới <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    className={`form-input ${passwordFieldErrors.newPassword ? 'error' : ''}`}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordFieldErrors.newPassword) {
                        setPasswordFieldErrors((prev) => ({ ...prev, newPassword: null }));
                      }
                    }}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordFieldErrors.newPassword && (
                  <span className="field-error-text">
                    {passwordFieldErrors.newPassword}
                  </span>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label htmlFor="confirm-new-password" className="form-label">
                  Xác nhận mật khẩu mới <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${passwordFieldErrors.confirmNewPassword ? 'error' : ''}`}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (passwordFieldErrors.confirmNewPassword) {
                        setPasswordFieldErrors((prev) => ({
                          ...prev,
                          confirmNewPassword: null,
                        }));
                      }
                    }}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordFieldErrors.confirmNewPassword && (
                  <span className="field-error-text">
                    {passwordFieldErrors.confirmNewPassword}
                  </span>
                )}
              </div>

              {/* Change Password Submit */}
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isChangingPassword}
                style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
