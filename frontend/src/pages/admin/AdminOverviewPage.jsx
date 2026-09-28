import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { reportService } from '../../services/reportService';
import { bookingService } from '../../services/bookingService';
import { formatVND, formatDateVN, formatTime } from '../../utils/formatters';
import './AdminOverviewPage.css';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, bookingsRes] = await Promise.allSettled([
          reportService.getOverview(),
          bookingService.getAllBookings({ page: 1, limit: 5 }),
        ]);

        if (isMounted) {
          if (overviewRes.status === 'fulfilled') {
            setStats(overviewRes.value);
          } else {
            console.error('Failed to load overview stats:', overviewRes.reason);
            setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');
          }

          if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.data) {
            setRecentBookings(bookingsRes.value.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Lỗi khi tải dữ liệu tổng quan');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="admin-pill admin-pill-success">Thành công</span>;
      case 'PENDING':
        return <span className="admin-pill admin-pill-warning">Đang giữ chỗ</span>;
      case 'CANCELLED':
        return <span className="admin-pill admin-pill-danger">Đã hủy</span>;
      case 'EXPIRED':
        return <span className="admin-pill admin-pill-neutral">Hết hạn</span>;
      default:
        return <span className="admin-pill admin-pill-neutral">{status}</span>;
    }
  };

  return (
    <div className="admin-overview-page">
      <div className="admin-page-header">
        <div>
          <h2>Tổng quan hệ thống</h2>
          <p>Xem nhanh các chỉ số hoạt động và dữ liệu mới nhất</p>
        </div>
        <div className="overview-header-actions">
          <Link to="/admin/reports" className="btn btn-secondary btn-sm">
            📈 Xem chi tiết báo cáo
          </Link>
          <Link to="/admin/showtimes" className="btn btn-primary btn-sm">
            + Tạo suất chiếu
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-card">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu tổng quan...</p>
        </div>
      ) : error ? (
        <div className="admin-card admin-error-banner">
          <p>⚠️ {error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* KPI Metrics */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper revenue">💰</div>
              <div className="kpi-info">
                <span className="kpi-label">Tổng doanh thu</span>
                <span className="kpi-value">{formatVND(stats?.totalRevenue ?? 0)}</span>
                <span className="kpi-note">Từ các đơn đặt vé thành công</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper bookings">🎟️</div>
              <div className="kpi-info">
                <span className="kpi-label">Tổng lượt đặt vé</span>
                <span className="kpi-value">{(stats?.totalBookings ?? 0).toLocaleString('vi-VN')}</span>
                <span className="kpi-note">Đơn đặt vé qua hệ thống</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper movies">🎬</div>
              <div className="kpi-info">
                <span className="kpi-label">Phim đang chiếu</span>
                <span className="kpi-value">{stats?.activeMovies ?? 0}</span>
                <span className="kpi-note">Đang có lịch chiếu phục vụ</span>
              </div>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="overview-shortcuts-section">
            <h3 className="section-title">Lối tắt quản lý</h3>
            <div className="shortcuts-grid">
              <Link to="/admin/movies" className="shortcut-card">
                <span className="shortcut-icon">🎬</span>
                <div className="shortcut-text">
                  <div className="shortcut-title">Quản lý Phim</div>
                  <div className="shortcut-desc">Thêm phim mới, chỉnh sửa thông tin, poster</div>
                </div>
              </Link>
              <Link to="/admin/showtimes" className="shortcut-card">
                <span className="shortcut-icon">🕒</span>
                <div className="shortcut-text">
                  <div className="shortcut-title">Suất chiếu</div>
                  <div className="shortcut-desc">Lên lịch chiếu phim theo phòng, giá vé</div>
                </div>
              </Link>
              <Link to="/admin/cinemas" className="shortcut-card">
                <span className="shortcut-icon">🏢</span>
                <div className="shortcut-text">
                  <div className="shortcut-title">Rạp & Sơ đồ ghế</div>
                  <div className="shortcut-desc">Cấu hình rạp, phòng chiếu, loại ghế VIP/Đôi</div>
                </div>
              </Link>
              <Link to="/admin/combos" className="shortcut-card">
                <span className="shortcut-icon">🍿</span>
                <div className="shortcut-text">
                  <div className="shortcut-title">Bắp nước & Combo</div>
                  <div className="shortcut-desc">Điều chỉnh giá combo, thực đơn ưu đãi</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="overview-recent-bookings">
            <div className="section-header-flex">
              <h3 className="section-title">Đơn đặt vé gần đây</h3>
              <Link to="/admin/bookings" className="view-all-link">
                Xem toàn bộ đơn →
              </Link>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Thời gian đặt</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Chưa có đơn đặt vé nào gần đây
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>#{b.id}</strong>
                        </td>
                        <td>
                          {b.user ? (
                            <div>
                              <div>{b.user.name || 'Khách vãng lai'}</div>
                              <small style={{ color: 'var(--text-muted)' }}>{b.user.email}</small>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>User #{b.userId}</span>
                          )}
                        </td>
                        <td>
                          {formatTime(b.createdAt)} - {formatDateVN(b.createdAt)}
                        </td>
                        <td>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                            {formatVND(b.totalPrice)}
                          </span>
                        </td>
                        <td>{getStatusBadge(b.status)}</td>
                        <td>
                          <Link
                            to={`/admin/bookings?bookingId=${b.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
