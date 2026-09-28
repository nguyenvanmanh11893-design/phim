import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import useAuth from '../../context/useAuth';
import { formatDateVN } from '../../utils/formatters';
import './AdminUsersPage.css';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters & Pagination
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Role Change Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState('user');
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadUsers() {
      try {
        const res = await userService.getUsers({
          page,
          limit: 15,
          role: roleFilter || undefined,
        });

        if (ignore) return;
        setUsers(res.users || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          limit: 15,
        });
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách người dùng');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      ignore = true;
    };
  }, [page, roleFilter, reloadKey]);

  const handleOpenRoleModal = (user) => {
    if (user.id === currentAdmin?.id) {
      alert('Bạn không thể tự thay đổi vai trò của chính tài khoản đang đăng nhập!');
      return;
    }
    setSelectedUser(user);
    setTargetRole(user.role || 'user');
    setModalError(null);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.id === currentAdmin?.id) {
      setModalError('Không thể tự thay đổi vai trò của chính mình');
      return;
    }

    setUpdating(true);
    setModalError(null);
    try {
      await userService.updateUserRole(selectedUser.id, targetRole);
      setSelectedUser(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setModalError(err.message || 'Lỗi khi cập nhật vai trò người dùng');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Người Dùng</h2>
          <p>Danh sách tài khoản thành viên và phân quyền vai trò quản trị hệ thống</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Phân loại vai trò:</label>
          <select
            className="admin-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả người dùng</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="user">Khách hàng (User)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Avatar</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày sinh</th>
              <th>Vai trò</th>
              <th>Ngày đăng ký</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Đang tải danh sách người dùng...
                  </span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentAdmin?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-avatar-cell">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} />
                        ) : (
                          <span>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{u.name || 'Người dùng'}</strong>
                      {isSelf && (
                        <span className="self-tag" title="Tài khoản hiện tại của bạn">
                          (Bạn)
                        </span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'Chưa cập nhật'}</td>
                    <td>{u.dateOfBirth ? formatDateVN(u.dateOfBirth) : 'Chưa cập nhật'}</td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="admin-pill admin-pill-danger">Quản trị viên (Admin)</span>
                      ) : (
                        <span className="admin-pill admin-pill-neutral">Khách hàng (User)</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDateVN(u.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRoleModal(u)}
                          disabled={isSelf}
                          title={isSelf ? 'Không thể tự đổi vai trò của chính mình' : 'Đổi vai trò'}
                        >
                          🛡️ Đổi vai trò
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="admin-pagination">
          <span>
            Trang {page} / {pagination.totalPages} (Tổng {pagination.total} tài khoản)
          </span>
          <div className="admin-pagination-btns">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Trang trước
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau →
            </button>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => !updating && setSelectedUser(null)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>🛡️ Cập nhật vai trò người dùng</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedUser(null)}
                disabled={updating}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="admin-modal-body">
                {modalError && <div className="admin-form-error-banner">⚠️ {modalError}</div>}

                <div className="user-role-summary-box">
                  <div>
                    <strong>{selectedUser.name || 'Người dùng'}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Email: {selectedUser.email} (ID #{selectedUser.id})
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>
                    Chọn vai trò mới: <span className="required-star">*</span>
                  </label>
                  <select
                    className="admin-select"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  >
                    <option value="user">Khách hàng (User) - Quyền đặt vé thông thường</option>
                    <option value="admin">
                      Quản trị viên (Admin) - Toàn quyền quản trị hệ thống
                    </option>
                  </select>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lưu ý: Cấp quyền Admin cho người dùng sẽ cho phép họ truy cập toàn bộ dữ liệu quản
                  trị và thay đổi cài đặt hệ thống.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUser(null)}
                  disabled={updating}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Đang cập nhật...' : 'Xác nhận đổi vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
