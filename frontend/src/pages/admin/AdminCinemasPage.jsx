import { useState, useEffect, useId } from 'react';
import { Link } from 'react-router';
import { cinemaService } from '../../services/cinemaService';
import { uploadService } from '../../services/uploadService';
import './AdminCinemasPage.css';

const POPULAR_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

const INITIAL_FORM = {
  name: '',
  city: 'Hà Nội',
  address: '',
  phone: '',
  imageUrl: '',
};

export default function AdminCinemasPage() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [reloadKey, setReloadKey] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const cinemaFileInputId = useId();

  useEffect(() => {
    let ignore = false;
    async function loadCinemas() {
      try {
        const res = await cinemaService.getCinemas({
          page,
          limit: 10,
          city: cityFilter || undefined,
        });
        if (ignore) return;
        setCinemas(res.cinemas || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          limit: 10,
        });
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách rạp');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCinemas();
    return () => {
      ignore = true;
    };
  }, [page, cityFilter, reloadKey]);

  const handleOpenCreate = () => {
    setEditingCinema(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cinema) => {
    setEditingCinema(cinema);
    setFormData({
      name: cinema.name || '',
      city: cinema.city || 'Hà Nội',
      address: cinema.address || '',
      phone: cinema.phone || '',
      imageUrl: cinema.imageUrl || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Chỉ hỗ trợ file ảnh định dạng JPEG, PNG hoặc WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setUploadingImage(true);
    setFormError(null);
    try {
      const uploadRes = await uploadService.uploadImage(file);
      const url = uploadRes?.url || uploadRes?.data?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, imageUrl: url }));
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi khi tải ảnh rạp lên');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên cụm rạp');
      return;
    }
    if (!formData.city.trim()) {
      setFormError('Vui lòng nhập hoặc chọn thành phố');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Vui lòng nhập địa chỉ cụ thể');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim() || null,
      imageUrl: formData.imageUrl.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editingCinema) {
        await cinemaService.updateCinema(editingCinema.id, payload);
      } else {
        await cinemaService.createCinema(payload);
      }
      setIsModalOpen(false);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message || 'Không thể lưu thông tin rạp');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await cinemaService.deleteCinema(deleteTarget.id);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa rạp (có thể còn phòng chiếu hoặc suất chiếu)');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-cinemas-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Cụm Rạp & Phòng Chiếu</h2>
          <p>Danh sách các rạp chiếu, quản lý phòng và sơ đồ ghế</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm cụm rạp mới
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Thành phố:</label>
          <select
            className="admin-select"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả thành phố</option>
            {POPULAR_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cinemas Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Hình ảnh</th>
              <th>Tên cụm rạp</th>
              <th>Thành phố</th>
              <th>Địa chỉ</th>
              <th>Số điện thoại</th>
              <th>Phòng chiếu</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách rạp...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : cinemas.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Chưa có cụm rạp nào phù hợp
                </td>
              </tr>
            ) : (
              cinemas.map((cinema) => (
                <tr key={cinema.id}>
                  <td>
                    <div className="admin-cinema-thumb">
                      {cinema.imageUrl ? (
                        <img src={cinema.imageUrl} alt={cinema.name} />
                      ) : (
                        <span>🏢</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cinema.name}</div>
                  </td>
                  <td>
                    <span className="admin-pill admin-pill-info">{cinema.city}</span>
                  </td>
                  <td>{cinema.address}</td>
                  <td>{cinema.phone || 'Chưa cập nhật'}</td>
                  <td>
                    <Link
                      to={`/admin/cinemas/${cinema.id}/rooms`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    >
                      🚪 Quản lý phòng →
                    </Link>
                  </td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(cinema)}
                        title="Chỉnh sửa rạp"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setDeleteTarget(cinema);
                          setDeleteError(null);
                        }}
                        title="Xóa rạp"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="admin-pagination">
          <span>
            Trang {page} / {pagination.totalPages} (Tổng {pagination.total} rạp)
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
              <h3>{editingCinema ? '✏️ Chỉnh sửa Cụm Rạp' : '🏢 Thêm Cụm Rạp Mới'}</h3>
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

                <div className="admin-form-group">
                  <label>
                    Tên cụm rạp <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="VD: CineBooking Bà Triệu"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Thành phố <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: Hà Nội, TP. Hồ Chí Minh..."
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: 024 3974 3333"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>
                    Địa chỉ chi tiết <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="VD: Tầng 6, Vincom Center, 191 Bà Triệu, Hai Bà Trưng"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                {/* Cinema Image Upload */}
                <div className="admin-form-group">
                  <label>Ảnh cụm rạp</label>
                  <div className="poster-upload-section">
                    <div className="poster-preview-box" style={{ width: '90px', height: '65px' }}>
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Rạp preview" />
                      ) : (
                        <span className="no-poster-text">Chưa có ảnh</span>
                      )}
                    </div>
                    <div className="poster-controls">
                      <div className="upload-file-row">
                        <label
                          htmlFor={cinemaFileInputId}
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: uploadingImage ? 'wait' : 'pointer' }}
                        >
                          {uploadingImage ? '⏳ Đang tải ảnh...' : '📁 Tải ảnh từ máy'}
                        </label>
                        <input
                          id={cinemaFileInputId}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </div>
                      <input
                        type="url"
                        className="admin-input"
                        placeholder="Hoặc dán URL ảnh rạp..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
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
                  {submitting ? 'Đang lưu...' : editingCinema ? 'Lưu thay đổi' : 'Tạo rạp'}
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
              <h3>🗑️ Xác nhận xóa cụm rạp</h3>
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
                Bạn có chắc chắn muốn xóa rạp{' '}
                <strong style={{ color: 'var(--accent)' }}>{deleteTarget.name}</strong> không?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nếu rạp đang chứa phòng chiếu hoặc suất chiếu, hãy xóa các phòng và suất chiếu
                trước khi xóa rạp.
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
