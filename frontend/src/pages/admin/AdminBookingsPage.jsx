import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { bookingService } from '../../services/bookingService';
import { showtimeService } from '../../services/showtimeService';
import { formatVND, formatDateVN, formatTime } from '../../utils/formatters';
import './AdminBookingsPage.css';

export default function AdminBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryBookingId = searchParams.get('bookingId');

  const [bookings, setBookings] = useState([]);
  const [showtimesMap, setShowtimesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const [nowTimestamp] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;
    async function loadBookings() {
      try {
        const res = await bookingService.getAllBookings({
          page,
          limit: 15,
          status: filterStatus || undefined,
          userId: filterUserId ? Number(filterUserId) : undefined,
        });

        if (ignore) return;
        const list = res.bookings || res.data || [];
        setBookings(list);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          limit: 15,
        });
        setError(null);

        // Fetch showtime details for unique showtimeIds
        const showtimeIds = [...new Set(list.map((b) => b.showtimeId).filter(Boolean))];
        if (showtimeIds.length > 0) {
          const promises = showtimeIds.map(async (stId) => {
            try {
              const st = await showtimeService.getShowtimeById(stId);
              return { [stId]: st };
            } catch {
              return { [stId]: null };
            }
          });
          const results = await Promise.all(promises);
          if (!ignore) {
            const merged = Object.assign({}, ...results);
            setShowtimesMap((prev) => ({ ...prev, ...merged }));
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải danh sách đặt vé');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBookings();
    return () => {
      ignore = true;
    };
  }, [page, filterStatus, filterUserId, reloadKey]);

  // Open Detail Modal by clicking
  const handleOpenDetail = useCallback(async (booking) => {
    setSelectedBooking(booking);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const data = await bookingService.getBookingById(booking.id);
      setDetailData(data);
    } catch (err) {
      setDetailError(err.message || 'Không thể tải chi tiết đơn đặt vé');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Handle URL query parameter `?bookingId=...`
  useEffect(() => {
    if (!queryBookingId) return;
    let ignore = false;
    async function loadQueryDetail() {
      try {
        const data = await bookingService.getBookingById(queryBookingId);
        if (ignore) return;
        setSelectedBooking({ id: queryBookingId });
        setDetailData(data);
      } catch (err) {
        if (!ignore) {
          setSelectedBooking({ id: queryBookingId });
          setDetailError(err.message || 'Không thể tải chi tiết đơn đặt vé');
        }
      } finally {
        if (!ignore) {
          setLoadingDetail(false);
        }
      }
    }
    loadQueryDetail();
    return () => {
      ignore = true;
    };
  }, [queryBookingId]);

  const handleCloseDetail = () => {
    setSelectedBooking(null);
    setDetailData(null);
    if (queryBookingId) {
      searchParams.delete('bookingId');
      setSearchParams(searchParams);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt vé #${selectedBooking.id}?`)) {
      return;
    }

    setCancelling(true);
    try {
      await bookingService.cancelBooking(selectedBooking.id);
      alert('Đã hủy đơn đặt vé thành công');
      handleCloseDetail();
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(`Lỗi khi hủy đơn: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (booking) => {
    const isExpired =
      booking.status === 'PENDING' &&
      booking.heldUntil &&
      new Date(booking.heldUntil).getTime() < nowTimestamp;

    if (isExpired) {
      return (
        <span
          className="admin-pill admin-pill-neutral"
          title={`Hết hạn giữ chỗ lúc ${formatTime(booking.heldUntil)} ${formatDateVN(booking.heldUntil)}`}
        >
          Hết hạn (Expired)
        </span>
      );
    }

    switch (booking.status) {
      case 'CONFIRMED':
        return <span className="admin-pill admin-pill-success">Thành công</span>;
      case 'PENDING':
        return <span className="admin-pill admin-pill-warning">Đang giữ chỗ</span>;
      case 'CANCELLED':
        return <span className="admin-pill admin-pill-danger">Đã hủy</span>;
      default:
        return <span className="admin-pill admin-pill-neutral">{booking.status}</span>;
    }
  };

  return (
    <div className="admin-bookings-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý Đặt Vé</h2>
          <p>Danh sách toàn bộ các lượt đặt vé của khách hàng trong hệ thống</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filters-bar">
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
            <option value="CONFIRMED">Thành công (CONFIRMED)</option>
            <option value="PENDING">Đang giữ chỗ (PENDING)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label className="admin-filter-label">Mã khách hàng (User ID):</label>
          <input
            type="number"
            min="1"
            className="admin-input"
            placeholder="VD: 5"
            style={{ width: '120px' }}
            value={filterUserId}
            onChange={(e) => {
              setFilterUserId(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {(filterStatus || filterUserId) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilterStatus('');
              setFilterUserId('');
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
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Phim & Rạp</th>
              <th>Thời gian chiếu</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thời gian đặt</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Đang tải danh sách đặt vé...
                  </span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
                  ⚠️ {error}
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy đơn đặt vé nào phù hợp
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>#{b.id}</strong>
                  </td>
                  <td>
                    {b.user ? (
                      <div className="booking-user-cell">
                        <strong>{b.user.name || 'Khách hàng'}</strong>
                        <small style={{ color: 'var(--text-muted)' }}>{b.user.email}</small>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>User #{b.userId}</span>
                    )}
                  </td>
                  <td>
                    <div>
                      <strong>{(b.showtime || showtimesMap[b.showtimeId])?.movie?.title || (b.showtimeId ? `Suất #${b.showtimeId}` : 'Phim')}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {(b.showtime || showtimesMap[b.showtimeId])?.cinema?.name || 'CGV Vincom Center'} •{' '}
                      {(b.showtime || showtimesMap[b.showtimeId])?.room?.name || 'Phòng chiếu'}
                    </div>
                  </td>
                  <td>
                    {(b.showtime || showtimesMap[b.showtimeId]) ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div>{formatDateVN((b.showtime || showtimesMap[b.showtimeId]).startTime)}</div>
                        <div style={{ color: 'var(--accent)' }}>
                          {formatTime((b.showtime || showtimesMap[b.showtimeId]).startTime)}
                        </div>
                      </div>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--accent)' }}>
                      {formatVND(b.totalPrice)}
                    </strong>
                  </td>
                  <td>{getStatusBadge(b)}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>{formatDateVN(b.createdAt)}</div>
                      <div>{formatTime(b.createdAt)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenDetail(b)}
                      >
                        👁️ Chi tiết
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
            Trang {page} / {pagination.totalPages} (Tổng {pagination.total} đơn)
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

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="admin-modal-backdrop" onClick={handleCloseDetail}>
          <div
            className="admin-modal-card modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3>🎟️ Chi tiết Đơn đặt vé #{selectedBooking.id}</h3>
              <button type="button" className="admin-modal-close" onClick={handleCloseDetail}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                  <p>Đang tải chi tiết đơn...</p>
                </div>
              ) : detailError ? (
                <div className="admin-form-error-banner">⚠️ {detailError}</div>
              ) : (
                detailData && (
                  <div className="booking-detail-content">
                    {/* Status & Timing Banner */}
                    <div className="detail-status-banner">
                      <div>
                        <span>Trạng thái: </span>
                        {getStatusBadge(detailData)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Ngày đặt: {formatTime(detailData.createdAt)} -{' '}
                        {formatDateVN(detailData.createdAt)}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="detail-section">
                      <h4 className="detail-section-title">👤 Thông tin khách hàng</h4>
                      <div className="detail-info-grid">
                        <div>
                          <label>Họ và tên:</label>
                          <span>{detailData.user?.name || 'Khách vãng lai'}</span>
                        </div>
                        <div>
                          <label>Email:</label>
                          <span>{detailData.user?.email || 'N/A'}</span>
                        </div>
                        <div>
                          <label>Số điện thoại:</label>
                          <span>{detailData.user?.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div>
                          <label>User ID:</label>
                          <span>#{detailData.userId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Showtime Info */}
                    <div className="detail-section">
                      <h4 className="detail-section-title">🎬 Thông tin suất chiếu</h4>
                      <div className="detail-info-grid">
                        <div>
                          <label>Tên phim:</label>
                          <strong>{(detailData.showtime || showtimesMap[detailData.showtimeId])?.movie?.title || 'Phim'}</strong>
                        </div>
                        <div>
                          <label>Cụm rạp:</label>
                          <span>
                            {(detailData.showtime || showtimesMap[detailData.showtimeId])?.cinema?.name ||
                              (detailData.showtime || showtimesMap[detailData.showtimeId])?.room?.cinema?.name ||
                              'CGV Vincom Center'}
                          </span>
                        </div>
                        <div>
                          <label>Phòng chiếu:</label>
                          <span>
                            {detailData.showtime?.room?.name} (
                            {detailData.showtime?.room?.type || '2D'})
                          </span>
                        </div>
                        <div>
                          <label>Giờ chiếu:</label>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                            {formatTime(detailData.showtime?.startTime)} ngày{' '}
                            {formatDateVN(detailData.showtime?.startTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Seats & Combos breakdown */}
                    <div className="detail-section">
                      <h4 className="detail-section-title">💺 Ghế và Bắp nước đã đặt</h4>

                      <div className="items-table-wrapper">
                        <table className="items-breakdown-table">
                          <thead>
                            <tr>
                              <th>Mục</th>
                              <th>Loại</th>
                              <th>Số lượng</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Seats */}
                            {Array.isArray(detailData.seats) &&
                              detailData.seats.map((seat) => (
                                <tr key={seat.id || seat.seatId}>
                                  <td>
                                    <strong>
                                      Ghế {seat.row || seat.seat?.row}
                                      {seat.number || seat.seat?.number}
                                    </strong>
                                  </td>
                                  <td>
                                    <span className="admin-tag-sm">
                                      {seat.type || seat.seat?.type || 'NORMAL'}
                                    </span>
                                  </td>
                                  <td>1</td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatVND(seat.price || 0)}
                                  </td>
                                </tr>
                              ))}

                            {/* Combos */}
                            {Array.isArray(detailData.combos) &&
                              detailData.combos.map((combo) => (
                                <tr key={combo.id || combo.comboId}>
                                  <td>
                                    <strong>{combo.name || combo.combo?.name}</strong>
                                  </td>
                                  <td>
                                    <span className="admin-tag-sm">Combo bắp nước</span>
                                  </td>
                                  <td>{combo.quantity}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatVND(
                                      (combo.price || combo.combo?.price || 0) * combo.quantity
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" style={{ fontWeight: 700, textAlign: 'right' }}>
                                Tổng thanh toán:
                              </td>
                              <td
                                style={{
                                  fontWeight: 800,
                                  color: 'var(--accent)',
                                  fontSize: '1.1rem',
                                  textAlign: 'right',
                                }}
                              >
                                {formatVND(detailData.totalPrice)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="admin-modal-footer">
              {detailData?.status === 'PENDING' && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy đơn đặt vé'}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleCloseDetail}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
