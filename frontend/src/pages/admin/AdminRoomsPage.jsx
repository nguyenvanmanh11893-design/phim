import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { cinemaService } from '../../services/cinemaService';
import './AdminRoomsPage.css';

const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Tiêu chuẩn (STANDARD)' },
  { value: 'VIP', label: 'Phòng VIP' },
  { value: 'IMAX', label: 'Phòng IMAX' },
];

const INITIAL_FORM = {
  name: '',
  type: 'STANDARD',
  totalRows: 8,
  seatsPerRow: 12,
};

export default function AdminRoomsPage() {
  const { cinemaId } = useParams();

  const [cinema, setCinema] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadCinemaAndRooms() {
      try {
        const [cinemaData, roomsData] = await Promise.all([
          cinemaService.getCinemaById(cinemaId),
          cinemaService.getRoomsByCinema(cinemaId),
        ]);
        if (ignore) return;
        setCinema(cinemaData);
        setRooms(roomsData || []);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải thông tin rạp và phòng chiếu');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCinemaAndRooms();
    return () => {
      ignore = true;
    };
  }, [cinemaId, reloadKey]);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({
      name: `Phòng ${rooms.length + 1}`,
      type: 'STANDARD',
      totalRows: 8,
      seatsPerRow: 12,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || '',
      type: room.type || 'STANDARD',
      totalRows: room.totalRows || 8,
      seatsPerRow: room.seatsPerRow || 12,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const rows = Number(formData.totalRows);
    const seats = Number(formData.seatsPerRow);

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên phòng chiếu');
      return;
    }
    if (isNaN(rows) || rows < 1 || rows > 26) {
      setFormError('Số hàng ghế phải từ 1 đến 26 (tương ứng từ A đến Z)');
      return;
    }
    if (isNaN(seats) || seats < 1 || seats > 50) {
      setFormError('Số ghế mỗi hàng phải từ 1 đến 50');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      totalRows: rows,
      seatsPerRow: seats,
    };

    setSubmitting(true);
    try {
      if (editingRoom) {
        await cinemaService.updateRoom(editingRoom.id, payload);
      } else {
        await cinemaService.createRoom(cinemaId, payload);
      }
      setIsModalOpen(false);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message || 'Không thể lưu thông tin phòng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await cinemaService.deleteRoom(deleteTarget.id);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa phòng chiếu (có thể đang có suất chiếu hoặc vé liên quan)');
    } finally {
      setDeleting(false);
    }
  };

  // Preview seats calculation
  const previewCapacity = useMemo(() => {
    const r = Math.min(26, Math.max(1, Number(formData.totalRows) || 1));
    const s = Math.min(50, Math.max(1, Number(formData.seatsPerRow) || 1));
    return r * s;
  }, [formData.totalRows, formData.seatsPerRow]);

  return (
    <div className="admin-rooms-page">
      {/* Top Breadcrumb & Cinema Header */}
      <div className="admin-breadcrumbs">
        <Link to="/admin/cinemas">← Danh sách cụm rạp</Link>
        <span>/</span>
        <span className="current-crumb">{cinema?.name || 'Chi tiết rạp'}</span>
      </div>

      <div className="admin-page-header">
        <div>
          <h2>Quản lý Phòng Chiếu — {cinema?.name || '...'}</h2>
          <p>
            Địa chỉ: {cinema?.address || '...'}, {cinema?.city || ''}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm phòng chiếu mới
        </button>
      </div>

      {/* Main Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên phòng</th>
              <th>Định dạng</th>
              <th>Kích thước hàng / cột</th>
              <th>Tổng sức chứa</th>
              <th>Sơ đồ ghế</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách phòng...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : rooms.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Rạp này chưa có phòng chiếu nào. Hãy bấm "Thêm phòng chiếu mới" để tạo.
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                const capacity = (room.totalRows || 0) * (room.seatsPerRow || 0);
                return (
                  <tr key={room.id}>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>#{room.id}</span>
                    </td>
                    <td>
                      <strong>{room.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`admin-pill ${
                          room.type === 'IMAX'
                            ? 'admin-pill-warning'
                            : room.type === 'VIP'
                              ? 'admin-pill-danger'
                              : 'admin-pill-neutral'
                        }`}
                      >
                        {room.type}
                      </span>
                    </td>
                    <td>
                      {room.totalRows} hàng × {room.seatsPerRow} ghế/hàng
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent)' }}>{capacity} ghế</strong>
                    </td>
                    <td>
                      <Link
                        to={`/admin/rooms/${room.id}/seats`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                      >
                        💺 Cấu hình sơ đồ ghế →
                      </Link>
                    </td>
                    <td>
                      <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(room)}
                          title="Chỉnh sửa phòng"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setDeleteTarget(room);
                            setDeleteError(null);
                          }}
                          title="Xóa phòng"
                        >
                          🗑️
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setIsModalOpen(false)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>{editingRoom ? '✏️ Chỉnh sửa Phòng Chiếu' : '🚪 Thêm Phòng Chiếu Mới'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {formError && <div className="admin-form-error-banner">⚠️ {formError}</div>}

                {editingRoom && (
                  <div className="admin-warning-box">
                    ⚠️ <strong>Cảnh báo:</strong> Nếu bạn thay đổi số hàng hoặc số ghế mỗi hàng,
                    toàn bộ ghế hiện tại của phòng sẽ được tạo lại tự động (trở về loại ghế
                    chuẩn NORMAL).
                  </div>
                )}

                <div className="admin-form-group">
                  <label>
                    Tên phòng chiếu <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="VD: Phòng 1, Cinema 2, IMAX Hall..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Định dạng chiếu <span className="required-star">*</span>
                  </label>
                  <select
                    className="admin-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Số hàng ghế (1 - 26) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="26"
                      className="admin-input"
                      value={formData.totalRows}
                      onChange={(e) => setFormData({ ...formData, totalRows: e.target.value })}
                      required
                    />
                    <span className="admin-form-help">
                      Từ hàng A đến {String.fromCharCode(64 + Math.min(26, Math.max(1, Number(formData.totalRows) || 1)))}
                    </span>
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Số ghế mỗi hàng (1 - 50) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="admin-input"
                      value={formData.seatsPerRow}
                      onChange={(e) => setFormData({ ...formData, seatsPerRow: e.target.value })}
                      required
                    />
                    <span className="admin-form-help">Ghế từ 1 đến {formData.seatsPerRow}</span>
                  </div>
                </div>

                {/* Capacity Preview */}
                <div className="room-preview-summary">
                  <div>
                    Sức chứa dự kiến:{' '}
                    <strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>
                      {previewCapacity} ghế
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Hệ thống sẽ tự động khởi tạo sơ đồ gồm {formData.totalRows} hàng và{' '}
                    {formData.seatsPerRow} cột. Bạn có thể gán loại VIP / Đôi tại trang cấu hình
                    ghế.
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingRoom ? 'Lưu thay đổi' : 'Tạo phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>🗑️ Xác nhận xóa phòng chiếu</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              {deleteError && <div className="admin-form-error-banner">⚠️ {deleteError}</div>}
              <p>
                Bạn có chắc chắn muốn xóa phòng{' '}
                <strong style={{ color: 'var(--accent)' }}>{deleteTarget.name}</strong> không?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tất cả ghế thuộc phòng này cũng sẽ bị xóa. Nếu phòng đang có lịch chiếu, hệ thống
                sẽ từ chối thao tác này.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
