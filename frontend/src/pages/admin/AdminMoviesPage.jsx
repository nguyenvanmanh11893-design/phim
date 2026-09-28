import { useState, useEffect, useId } from 'react';
import { Link } from 'react-router';
import { movieService } from '../../services/movieService';
import { uploadService } from '../../services/uploadService';
import { formatDateVN } from '../../utils/formatters';
import './AdminMoviesPage.css';

const AGE_RATINGS = [
  { value: 'P', label: 'P - Phổ biến mọi độ tuổi' },
  { value: 'K', label: 'K - Dưới 13 tuổi có phụ huynh đi kèm' },
  { value: 'T13', label: 'T13 - Khán giả từ 13 tuổi trở lên' },
  { value: 'T16', label: 'T16 - Khán giả từ 16 tuổi trở lên' },
  { value: 'T18', label: 'T18 - Khán giả từ 18 tuổi trở lên' },
];

const LANGUAGES = [
  { value: 'Vietsub', label: 'Vietsub (Phụ đề tiếng Việt)' },
  { value: 'Lồng tiếng', label: 'Lồng tiếng' },
  { value: 'Nguyên bản', label: 'Nguyên bản' },
];

const GENRE_OPTIONS = [
  'Hành động',
  'Phiêu lưu',
  'Hoạt hình',
  'Hài hước',
  'Tội phạm',
  'Tài liệu',
  'Kịch tính',
  'Gia đình',
  'Giả tưởng',
  'Kinh dị',
  'Bí ẩn',
  'Lãng mạn',
  'Khoa học viễn tưởng',
  'Gây cấn',
  'Chiến tranh',
];

const INITIAL_FORM = {
  title: '',
  description: '',
  duration: 120,
  releaseDate: '',
  endDate: '',
  posterUrl: '',
  trailerUrl: '',
  genres: ['Hành động'],
  directors: [''],
  cast: [''],
  ageRating: 'T13',
  language: 'Vietsub',
};

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [reloadKey, setReloadKey] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const posterFileInputId = useId();

  useEffect(() => {
    let ignore = false;
    async function loadMovies() {
      try {
        const res = await movieService.getMovies({
          page,
          limit: 10,
          search: searchTerm.trim() || undefined,
          genre: filterGenre || undefined,
          status: filterStatus || undefined,
        });

        if (ignore) return;
        const list = res?.data || res?.movies || [];
        setMovies(list);
        setPagination({
          total: res?.total ?? list.length,
          totalPages: res?.totalPages ?? 1,
          limit: res?.limit ?? 10,
        });
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách phim');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMovies();
    return () => {
      ignore = true;
    };
  }, [page, searchTerm, filterGenre, filterStatus, reloadKey]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingMovie(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      duration: movie.duration || 120,
      releaseDate: movie.releaseDate ? movie.releaseDate.substring(0, 10) : '',
      endDate: movie.endDate ? movie.endDate.substring(0, 10) : '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      genres: Array.isArray(movie.genres) ? movie.genres : ['Hành động'],
      directors: Array.isArray(movie.directors) && movie.directors.length > 0 ? movie.directors : [''],
      cast: Array.isArray(movie.cast) && movie.cast.length > 0 ? movie.cast : [''],
      ageRating: movie.ageRating || 'T13',
      language: movie.language || 'Vietsub',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Poster Upload via POST /upload/image
  const handlePosterUpload = async (e) => {
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

    setUploadingPoster(true);
    setFormError(null);
    try {
      const uploadRes = await uploadService.uploadImage(file);
      const url = uploadRes?.url || uploadRes?.data?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, posterUrl: url }));
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploadingPoster(false);
      e.target.value = '';
    }
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tên phim');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Vui lòng nhập tóm tắt nội dung phim');
      return;
    }
    if (!formData.duration || Number(formData.duration) <= 0) {
      setFormError('Thời lượng phim phải lớn hơn 0 phút');
      return;
    }
    if (!formData.releaseDate) {
      setFormError('Vui lòng chọn ngày khởi chiếu');
      return;
    }
    if (!formData.endDate) {
      setFormError('Vui lòng chọn ngày kết thúc chiếu');
      return;
    }
    if (formData.endDate < formData.releaseDate) {
      setFormError('Ngày kết thúc chiếu không được trước ngày khởi chiếu');
      return;
    }

    const cleanGenres = formData.genres.filter((g) => g && g.trim());
    if (cleanGenres.length === 0) {
      setFormError('Phim phải có ít nhất 1 thể loại');
      return;
    }

    const cleanDirectors = formData.directors.map((d) => d.trim()).filter(Boolean);
    if (cleanDirectors.length === 0) {
      setFormError('Vui lòng nhập ít nhất 1 đạo diễn');
      return;
    }

    const cleanCast = formData.cast.map((c) => c.trim()).filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      duration: Number(formData.duration),
      releaseDate: formData.releaseDate,
      endDate: formData.endDate || null,
      posterUrl: formData.posterUrl.trim() || null,
      trailerUrl: formData.trailerUrl.trim() || null,
      genres: cleanGenres,
      directors: cleanDirectors,
      cast: cleanCast,
      ageRating: formData.ageRating,
      language: formData.language,
    };

    setSubmitting(true);
    try {
      if (editingMovie) {
        await movieService.updateMovie(editingMovie.id, payload);
      } else {
        await movieService.createMovie(payload);
      }
      setIsModalOpen(false);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message || 'Không thể lưu thông tin phim');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await movieService.deleteMovie(deleteTarget.id);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa phim này (có thể đã có lịch chiếu hoặc đơn đặt vé)');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'now_showing':
        return <span className="admin-pill admin-pill-success">Đang chiếu</span>;
      case 'coming_soon':
        return <span className="admin-pill admin-pill-warning">Sắp chiếu</span>;
      case 'ended':
        return <span className="admin-pill admin-pill-neutral">Đã kết thúc</span>;
      default:
        return <span className="admin-pill admin-pill-neutral">{status}</span>;
    }
  };

  return (
    <div className="admin-movies-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Phim</h2>
          <p>Danh sách phim, thêm mới, cập nhật nội dung và poster</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm phim mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group" style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="admin-input"
            style={{ width: '100%' }}
            placeholder="🔍 Tìm kiếm theo tên phim..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="admin-filter-group">
          <label className="admin-filter-label">Trạng thái:</label>
          <select
            className="admin-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="now_showing">Đang chiếu</option>
            <option value="coming_soon">Sắp chiếu</option>
            <option value="ended">Đã kết thúc</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label className="admin-filter-label">Thể loại:</label>
          <select
            className="admin-select"
            value={filterGenre}
            onChange={(e) => {
              setFilterGenre(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả thể loại</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Poster</th>
              <th>Tên phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Độ tuổi / Ngôn ngữ</th>
              <th>Khởi chiếu</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách phim...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : movies.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy phim nào phù hợp điều kiện lọc
                </td>
              </tr>
            ) : (
              movies.map((movie) => (
                <tr key={movie.id}>
                  <td>
                    <div className="admin-movie-thumb">
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.title} />
                      ) : (
                        <span>🎬</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="movie-title-cell">
                      <strong>{movie.title}</strong>
                      <span className="movie-sub-info">
                        Đạo diễn: {Array.isArray(movie.directors) ? movie.directors.join(', ') : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="movie-genres-tags">
                      {Array.isArray(movie.genres) &&
                        movie.genres.map((g) => (
                          <span key={g} className="admin-tag-sm">
                            {g}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>{movie.duration} phút</td>
                  <td>
                    <span className="admin-pill admin-pill-info">{movie.ageRating}</span>
                    <span style={{ marginLeft: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {movie.language}
                    </span>
                  </td>
                  <td>
                    <div>{formatDateVN(movie.releaseDate)}</div>
                    {movie.endDate && (
                      <small style={{ color: 'var(--text-muted)' }}>
                        Đến: {formatDateVN(movie.endDate)}
                      </small>
                    )}
                  </td>
                  <td>{getStatusBadge(movie.status)}</td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <Link
                        to={`/admin/ratings?movieId=${movie.id}`}
                        className="btn btn-secondary btn-sm"
                        title="Xem đánh giá"
                      >
                        ⭐
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(movie)}
                        title="Chỉnh sửa"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setDeleteTarget(movie);
                          setDeleteError(null);
                        }}
                        title="Xóa phim"
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
            Trang {page} / {pagination.totalPages} (Tổng {pagination.total} phim)
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
            className="admin-modal-card modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>{editingMovie ? '✏️ Cập nhật Phim' : '🎬 Thêm Phim Mới'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="admin-modal-body">
                {formError && (
                  <div className="admin-form-error-banner">⚠️ {formError}</div>
                )}

                <div className="admin-form-group">
                  <label>
                    Tên phim <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tên phim chính xác..."
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Thời lượng (phút) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="admin-input"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Độ tuổi <span className="required-star">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={formData.ageRating}
                      onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                    >
                      {AGE_RATINGS.map((ar) => (
                        <option key={ar.value} value={ar.value}>
                          {ar.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Ngôn ngữ <span className="required-star">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Ngày khởi chiếu <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="admin-input"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Ngày kết thúc chiếu <span className="required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className="admin-input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Poster Upload Section */}
                <div className="admin-form-group">
                  <label>Poster Phim</label>
                  <div className="poster-upload-section">
                    <div className="poster-preview-box">
                      {formData.posterUrl ? (
                        <img src={formData.posterUrl} alt="Poster preview" />
                      ) : (
                        <span className="no-poster-text">Chưa có ảnh</span>
                      )}
                    </div>
                    <div className="poster-controls">
                      <div className="upload-file-row">
                        <label
                          htmlFor={posterFileInputId}
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: uploadingPoster ? 'wait' : 'pointer' }}
                        >
                          {uploadingPoster ? '⏳ Đang tải ảnh lên...' : '📁 Tải ảnh từ máy'}
                        </label>
                        <input
                          id={posterFileInputId}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handlePosterUpload}
                          disabled={uploadingPoster}
                        />
                        <span className="admin-form-help">
                          Hỗ trợ JPEG, PNG, WEBP tối đa 5MB
                        </span>
                      </div>
                      <div className="or-divider">hoặc nhập trực tiếp URL ảnh:</div>
                      <input
                        type="url"
                        className="admin-input"
                        placeholder="https://example.com/poster.jpg"
                        value={formData.posterUrl}
                        onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>URL Trailer (YouTube iframe / video)</label>
                  <input
                    type="url"
                    className="admin-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                  />
                </div>

                {/* Genres Multi-select checkboxes */}
                <div className="admin-form-group">
                  <label>
                    Thể loại <span className="required-star">*</span>
                  </label>
                  <div className="genre-checkbox-grid">
                    {GENRE_OPTIONS.map((genre) => {
                      const isChecked = formData.genres.includes(genre);
                      return (
                        <label key={genre} className="genre-checkbox-item">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  genres: [...formData.genres, genre],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  genres: formData.genres.filter((g) => g !== genre),
                                });
                              }
                            }}
                          />
                          <span>{genre}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Đạo diễn <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Phân cách bằng dấu phẩy: Christopher Nolan, ..."
                      value={formData.directors.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          directors: e.target.value.split(',').map((s) => s.trimStart()),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Diễn viên</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Phân cách bằng dấu phẩy: Leonardo DiCaprio, ..."
                      value={formData.cast.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cast: e.target.value.split(',').map((s) => s.trimStart()),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>
                    Tóm tắt nội dung <span className="required-star">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="admin-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả cốt truyện, nội dung phim..."
                    required
                  />
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
                  {submitting ? 'Đang lưu...' : editingMovie ? 'Lưu thay đổi' : 'Tạo phim'}
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
              <h3>🗑️ Xác nhận xóa phim</h3>
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
              {deleteError && (
                <div className="admin-form-error-banner">⚠️ {deleteError}</div>
              )}
              <p>
                Bạn có chắc chắn muốn xóa phim{' '}
                <strong style={{ color: 'var(--accent)' }}>{deleteTarget.title}</strong> không?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lưu ý: Nếu phim đã có lịch chiếu hoặc đơn đặt vé liên kết trong hệ thống, backend
                sẽ từ chối thao tác xóa để đảm bảo toàn vẹn dữ liệu.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy bỏ
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
