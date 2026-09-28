import { useState, useEffect, useId } from 'react';
import { comboService } from '../../services/comboService';
import { uploadService } from '../../services/uploadService';
import { formatVND } from '../../utils/formatters';
import './AdminCombosPage.css';

const INITIAL_FORM = {
  name: '',
  description: '',
  price: 80000,
  imageUrl: '',
  isActive: true,
};

export default function AdminCombosPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filter
  const [activeFilter, setActiveFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const comboFileInputId = useId();

  useEffect(() => {
    let ignore = false;
    async function loadCombos() {
      try {
        let filterParam;
        if (activeFilter === 'true') filterParam = true;
        if (activeFilter === 'false') filterParam = false;

        const res = await comboService.getCombos({ isActive: filterParam, limit: 100 });
        if (ignore) return;
        const comboList = Array.isArray(res) ? res : (res?.combos || []);
        setCombos(comboList);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách combo bắp nước');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCombos();
    return () => {
      ignore = true;
    };
  }, [activeFilter, reloadKey]);

  const handleOpenCreate = () => {
    setEditingCombo(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name || '',
      description: combo.description || '',
      price: combo.price || 0,
      imageUrl: combo.imageUrl || '',
      isActive: combo.isActive !== false,
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
      setFormError(err.message || 'Lỗi khi tải ảnh combo lên');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên combo');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Vui lòng nhập mô tả combo');
      return;
    }
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Giá combo phải lớn hơn 0 VNĐ');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: priceNum,
      imageUrl: formData.imageUrl.trim() || null,
      isActive: formData.isActive,
    };

    setSubmitting(true);
    try {
      if (editingCombo) {
        await comboService.updateCombo(editingCombo.id, payload);
      } else {
        await comboService.createCombo(payload);
      }
      setIsModalOpen(false);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message || 'Không thể lưu combo bắp nước');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActiveQuick = async (combo) => {
    try {
      await comboService.updateCombo(combo.id, { isActive: !combo.isActive });
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(`Không thể đổi trạng thái: ${err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await comboService.deleteCombo(deleteTarget.id);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa combo này');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-combos-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Combo Bắp Nước</h2>
          <p>Thực đơn combo ưu đãi dành cho khách hàng khi đặt vé xem phim</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm combo mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Trạng thái bán:</label>
          <select
            className="admin-select"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">Tất cả combo</option>
            <option value="true">Đang mở bán</option>
            <option value="false">Tạm ngừng bán</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Hình ảnh</th>
              <th>Tên combo</th>
              <th>Mô tả chi tiết</th>
              <th>Đơn giá</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách combo...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : !Array.isArray(combos) || combos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Chưa có combo nào phù hợp
                </td>
              </tr>
            ) : (
              combos.map((combo) => (
                <tr key={combo.id}>
                  <td>
                    <div className="admin-combo-thumb">
                      {combo.imageUrl ? (
                        <img src={combo.imageUrl} alt={combo.name} />
                      ) : (
                        <span>🍿</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{combo.name}</strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {combo.description}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent)' }}>
                      {formatVND(combo.price)}
                    </strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`admin-pill ${combo.isActive ? 'admin-pill-success' : 'admin-pill-neutral'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleActiveQuick(combo)}
                      title="Bấm để bật/tắt bán combo"
                    >
                      {combo.isActive ? '● Đang bán' : '○ Tạm ngừng'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(combo)}
                        title="Chỉnh sửa combo"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setDeleteTarget(combo);
                          setDeleteError(null);
                        }}
                        title="Xóa combo"
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
              <h3>{editingCombo ? '✏️ Chỉnh sửa Combo Bắp Nước' : '🍿 Thêm Combo Mới'}</h3>
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
                    Tên combo <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="VD: Combo Solo 1 Bắp 1 Nước"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Mô tả thành phần <span className="required-star">*</span>
                  </label>
                  <textarea
                    rows={2}
                    className="admin-input"
                    placeholder="VD: 1 Bắp ngọt 69oz + 1 Nước ngọt có gas 32oz"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Đơn giá (VNĐ) <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    className="admin-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="admin-form-group">
                  <label>Hình ảnh Combo</label>
                  <div className="poster-upload-section">
                    <div className="poster-preview-box" style={{ width: '80px', height: '80px' }}>
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Combo preview" />
                      ) : (
                        <span className="no-poster-text">Chưa có ảnh</span>
                      )}
                    </div>
                    <div className="poster-controls">
                      <div className="upload-file-row">
                        <label
                          htmlFor={comboFileInputId}
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: uploadingImage ? 'wait' : 'pointer' }}
                        >
                          {uploadingImage ? '⏳ Đang tải ảnh...' : '📁 Tải ảnh từ máy'}
                        </label>
                        <input
                          id={comboFileInputId}
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
                        placeholder="Hoặc dán URL ảnh combo..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="switch-toggle-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Mở bán combo này cho khách hàng khi đặt vé</span>
                  </label>
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
                  {submitting ? 'Đang lưu...' : editingCombo ? 'Lưu thay đổi' : 'Tạo combo'}
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
              <h3>🗑️ Xác nhận xóa combo</h3>
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
                Bạn có chắc chắn muốn xóa combo{' '}
                <strong style={{ color: 'var(--accent)' }}>{deleteTarget.name}</strong> không?
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
