import { useState, useEffect } from 'react';
import { showtimeService } from '../../services/showtimeService';
import { movieService } from '../../services/movieService';
import { cinemaService } from '../../services/cinemaService';
import { formatVND, formatDateVN, formatTime } from '../../utils/formatters';
import './AdminShowtimesPage.css';

const DEFAULT_PRICES = {
  basePrice: 90000,
  vipPrice: 120000,
  couplePrice: 200000,
};

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter options
  const [allMovies, setAllMovies] = useState([]);
  const [allCinemas, setAllCinemas] = useState([]);

  // Filters state
  const [filterMovieId, setFilterMovieId] = useState('');
  const [filterCinemaId, setFilterCinemaId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Creation / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [modalCinemaId, setModalCinemaId] = useState('');
  const [modalRooms, setModalRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [formData, setFormData] = useState({
    movieId: '',
    roomId: '',
    startTime: '',
    basePrice: DEFAULT_PRICES.basePrice,
    vipPrice: DEFAULT_PRICES.vipPrice,
    couplePrice: DEFAULT_PRICES.couplePrice,
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Cancel Modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Load initial dropdown options (Movies, Cinemas)
  useEffect(() => {
    let isMounted = true;
    async function loadDropdowns() {
      try {
        const [moviesRes, cinemasRes] = await Promise.all([
          movieService.getMovies({ limit: 100 }),
          cinemaService.getCinemas({ limit: 100 }),
        ]);
        if (isMounted) {
          setAllMovies(moviesRes?.data || moviesRes?.movies || []);
          setAllCinemas(cinemasRes?.cinemas || []);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadDropdowns();
    return () => {
      isMounted = false;
    };
  }, []);

  const [reloadKey, setReloadKey] = useState(0);

  // Fetch showtimes
  useEffect(() => {
    let ignore = false;
    async function loadShowtimes() {
      try {
        const res = await showtimeService.getShowtimes({
          page,
          limit: 15,
          movieId: filterMovieId ? Number(filterMovieId) : undefined,
          cinemaId: filterCinemaId ? Number(filterCinemaId) : undefined,
          date: filterDate || undefined,
          status: filterStatus || undefined,
        });

        if (ignore) return;
        setShowtimes(res.showtimes || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          limit: 15,
        });
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách suất chiếu');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadShowtimes();
    return () => {
      ignore = true;
    };
  }, [page, filterMovieId, filterCinemaId, filterDate, filterStatus, reloadKey]);

  // When modal cinema changes, load rooms for that cinema
  useEffect(() => {
    if (!modalCinemaId) return;

    let isMounted = true;
    async function loadRooms() {
      try {
        const rooms = await cinemaService.getRoomsByCinema(modalCinemaId);
        if (isMounted) {
          setModalRooms(rooms || []);
          if (rooms && rooms.length > 0 && !formData.roomId) {
            setFormData((prev) => ({ ...prev, roomId: rooms[0].id }));
          }
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    }
    loadRooms();
    return () => {
      isMounted = false;
    };
  }, [modalCinemaId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingShowtime(null);
    const initialMovieId = allMovies[0]?.id || '';
    const initialCinemaId = allCinemas[0]?.id || '';
    setModalCinemaId(initialCinemaId);
    setFormData({
      movieId: initialMovieId,
      roomId: '',
      startTime: '',
      basePrice: DEFAULT_PRICES.basePrice,
      vipPrice: DEFAULT_PRICES.vipPrice,
      couplePrice: DEFAULT_PRICES.couplePrice,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (showtime) => {
    setEditingShowtime(showtime);
    const cinemaId = showtime.room?.cinemaId || showtime.cinemaId || '';
    setModalCinemaId(cinemaId);

    // Format ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
    let localDatetimeStr = '';
    if (showtime.startTime) {
      const dt = new Date(showtime.startTime);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      localDatetimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setFormData({
      movieId: showtime.movieId || showtime.movie?.id || '',
      roomId: showtime.roomId || showtime.room?.id || '',
      startTime: localDatetimeStr,
      basePrice: showtime.basePrice || DEFAULT_PRICES.basePrice,
      vipPrice: showtime.vipPrice || DEFAULT_PRICES.vipPrice,
      couplePrice: showtime.couplePrice || DEFAULT_PRICES.couplePrice,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.movieId) {
      setFormError('Vui lòng chọn phim');
      return;
    }
    if (!formData.roomId) {
      setFormError('Vui lòng chọn phòng chiếu');
      return;
    }
    if (!formData.startTime) {
      setFormError('Vui lòng chọn thời gian bắt đầu chiếu');
      return;
    }

    const base = Number(formData.basePrice);
    const vip = Number(formData.vipPrice);
    const couple = Number(formData.couplePrice);

    if (isNaN(base) || base <= 0) {
      setFormError('Giá vé thường phải lớn hơn 0');
      return;
    }
    if (isNaN(vip) || vip < base) {
      setFormError('Giá vé VIP phải lớn hơn hoặc bằng giá vé thường');
      return;
    }
    if (isNaN(couple) || couple < base) {
      setFormError('Giá vé đôi phải lớn hơn hoặc bằng giá vé thường');
      return;
    }

    // Convert local datetime input to ISO string
    const startIso = new Date(formData.startTime).toISOString();

    setSubmitting(true);
    try {
      if (editingShowtime) {
        await showtimeService.updateShowtime(editingShowtime.id, {
          roomId: Number(formData.roomId),
          startTime: startIso,
          basePrice: base,
          vipPrice: vip,
          couplePrice: couple,
        });
      } else {
        await showtimeService.createShowtime({
          movieId: Number(formData.movieId),
          roomId: Number(formData.roomId),
          startTime: startIso,
          basePrice: base,
          vipPrice: vip,
          couplePrice: couple,
        });
      }
      setIsModalOpen(false);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message || 'Không thể lưu suất chiếu (có thể bị trùng lịch phòng)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await showtimeService.cancelShowtime(cancelTarget.id);
      setCancelTarget(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setCancelError(err.message || 'Không thể hủy suất chiếu này');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="admin-pill admin-pill-info">Sắp chiếu</span>;
      case 'ONGOING':
        return <span className="admin-pill admin-pill-success">Đang chiếu</span>;
      case 'ENDED':
        return <span className="admin-pill admin-pill-neutral">Đã kết thúc</span>;
      case 'CANCELLED':
        return <span className="admin-pill admin-pill-danger">Đã hủy</span>;
      default:
        return <span className="admin-pill admin-pill-neutral">{status}</span>;
    }
  };

  return (
    <div className="admin-showtimes-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Suất Chiếu</h2>
          <p>Lên lịch chiếu phim theo từng rạp, phòng chiếu và mức giá vé</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm suất chiếu mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Phim:</label>
          <select
            className="admin-select"
            value={filterMovieId}
            onChange={(e) => {
              setFilterMovieId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả phim</option>
            {allMovies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-group">
          <label className="admin-filter-label">Cụm rạp:</label>
          <select
            className="admin-select"
            value={filterCinemaId}
            onChange={(e) => {
              setFilterCinemaId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả rạp</option>
            {allCinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-group">
          <label className="admin-filter-label">Ngày chiếu:</label>
          <input
            type="date"
            className="admin-input"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
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
            <option value="SCHEDULED">Sắp chiếu</option>
            <option value="ONGOING">Đang chiếu</option>
            <option value="ENDED">Đã kết thúc</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        {(filterMovieId || filterCinemaId || filterDate || filterStatus) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilterMovieId('');
              setFilterCinemaId('');
              setFilterDate('');
              setFilterStatus('');
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Phim</th>
              <th>Rạp / Phòng</th>
              <th>Thời gian</th>
              <th>Giá vé (Thường / VIP / Đôi)</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Đang tải danh sách suất chiếu...
                  </span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : showtimes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy suất chiếu nào phù hợp
                </td>
              </tr>
            ) : (
              showtimes.map((st) => {
                const movieObj = st.movie || allMovies.find((m) => Number(m.id) === Number(st.movieId));
                const cinemaObj = st.cinema || allCinemas.find((c) => Number(c.id) === Number(st.cinemaId || st.room?.cinemaId));
                return (
                  <tr key={st.id}>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>#{st.id}</span>
                    </td>
                    <td>
                      <div className="st-movie-cell">
                        <strong>{movieObj?.title || `Phim #${st.movieId}`}</strong>
                        <small style={{ color: 'var(--text-muted)' }}>
                          {movieObj?.duration ? `${movieObj.duration} phút` : ''}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{st.cinema?.name || cinemaObj?.name || 'CGV Vincom Center'}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {st.room?.name || (st.roomId === 1 ? 'Phòng 2' : st.roomId === 2 ? 'Phòng 1' : `Phòng #${st.roomId}`)} ({st.room?.type || (st.roomId === 1 ? 'VIP' : 'IMAX')})
                      </div>
                    </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{formatDateVN(st.startTime)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>
                      {formatTime(st.startTime)} → {formatTime(st.endTime)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span>{formatVND(st.basePrice)}</span> /{' '}
                      <span style={{ color: '#ef4444' }}>{formatVND(st.vipPrice)}</span> /{' '}
                      <span style={{ color: '#ec4899' }}>{formatVND(st.couplePrice)}</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(st.status)}</td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(st)}
                        disabled={st.status === 'CANCELLED' || st.status === 'ENDED'}
                        title="Chỉnh sửa suất chiếu"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setCancelTarget(st);
                          setCancelError(null);
                        }}
                        disabled={st.status === 'CANCELLED' || st.status === 'ENDED'}
                        title="Hủy suất chiếu"
                      >
                        ⛔ Hủy
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
            Trang {page} / {pagination.totalPages} (Tổng {pagination.total} suất chiếu)
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
              <h3>{editingShowtime ? '✏️ Chỉnh sửa Suất Chiếu' : '🕒 Thêm Suất Chiếu Mới'}</h3>
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

                {/* Movie Selector */}
                <div className="admin-form-group">
                  <label>
                    Chọn Phim <span className="required-star">*</span>
                  </label>
                  <select
                    className="admin-select"
                    value={formData.movieId}
                    disabled={Boolean(editingShowtime)}
                    onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn phim --</option>
                    {allMovies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.duration} phút)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cinema & Room Cascading Selector */}
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Chọn Cụm Rạp <span className="required-star">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={modalCinemaId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalCinemaId(val);
                        if (!val) setModalRooms([]);
                        setFormData((prev) => ({ ...prev, roomId: '' }));
                      }}
                      required
                    >
                      <option value="">-- Chọn cụm rạp --</option>
                      {allCinemas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Chọn Phòng Chiếu <span className="required-star">*</span>
                    </label>
                    <select
                      className="admin-select"
                      value={formData.roomId}
                      disabled={loadingRooms || modalRooms.length === 0}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      required
                    >
                      {loadingRooms ? (
                        <option>Đang tải danh sách phòng...</option>
                      ) : modalRooms.length === 0 ? (
                        <option value="">(Rạp này chưa có phòng chiếu)</option>
                      ) : (
                        modalRooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.type} - {r.totalRows * r.seatsPerRow} ghế)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Start Time */}
                <div className="admin-form-group">
                  <label>
                    Thời gian bắt đầu chiếu <span className="required-star">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                  <span className="admin-form-help">
                    Hệ thống sẽ tự động tính thời gian kết thúc dựa trên thời lượng phim + 15 phút
                    nghỉ giữa các suất.
                  </span>
                </div>

                {/* Prices */}
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>
                      Giá vé Thường (VNĐ) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="10000"
                      step="5000"
                      className="admin-input"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Giá vé VIP (VNĐ) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="10000"
                      step="5000"
                      className="admin-input"
                      value={formData.vipPrice}
                      onChange={(e) => setFormData({ ...formData, vipPrice: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Giá vé Đôi (VNĐ) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="10000"
                      step="5000"
                      className="admin-input"
                      value={formData.couplePrice}
                      onChange={(e) => setFormData({ ...formData, couplePrice: e.target.value })}
                      required
                    />
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
                  {submitting ? 'Đang lưu...' : editingShowtime ? 'Lưu thay đổi' : 'Tạo suất chiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="admin-modal-backdrop" onClick={() => !cancelling && setCancelTarget(null)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>⛔ Xác nhận hủy suất chiếu</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              {cancelError && <div className="admin-form-error-banner">⚠️ {cancelError}</div>}
              <p>
                Bạn có chắc chắn muốn hủy suất chiếu{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  #{cancelTarget.id} — {cancelTarget.movie?.title}
                </strong>{' '}
                vào lúc {formatTime(cancelTarget.startTime)} ngày {formatDateVN(cancelTarget.startTime)} không?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Sau khi hủy, khách hàng sẽ không thể đặt vé cho suất chiếu này nữa.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
