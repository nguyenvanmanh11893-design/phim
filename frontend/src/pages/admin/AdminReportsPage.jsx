import { useState, useEffect, useMemo } from 'react';
import { reportService } from '../../services/reportService';
import { formatVND, formatDateVN, toLocalDateString } from '../../utils/formatters';
import './AdminReportsPage.css';

export default function AdminReportsPage() {
  // Active Tab: 'time' | 'movies' | 'cinemas'
  const [activeTab, setActiveTab] = useState('time');

  // Filter state
  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      start: toLocalDateString(start),
      end: toLocalDateString(end),
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [groupBy, setGroupBy] = useState('day'); // 'day' | 'month'

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function loadReport() {
      try {
        let data = [];
        if (activeTab === 'time') {
          data = await reportService.getRevenueByTime({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            groupBy,
          });
        } else if (activeTab === 'movies') {
          data = await reportService.getRevenueByMovies({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
        } else if (activeTab === 'cinemas') {
          data = await reportService.getRevenueByCinemas({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
        }
        if (ignore) return;
        setReportData(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải dữ liệu báo cáo');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReport();
    return () => {
      ignore = true;
    };
  }, [activeTab, startDate, endDate, groupBy, reloadKey]);

  // Helper to safely extract booking count from an item across various field names
  const getBookingCount = (item) => {
    if (!item) return 0;
    return (
      Number(item.totalBookings) ||
      Number(item.bookingCount) ||
      Number(item.total_bookings) ||
      Number(item.booking_count) ||
      Number(item.bookings) ||
      0
    );
  };

  // Aggregate totals
  const totalRevenue = useMemo(() => {
    return reportData.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
  }, [reportData]);

  const totalBookings = useMemo(() => {
    return reportData.reduce(
      (sum, item) => sum + getBookingCount(item),
      0
    );
  }, [reportData]);

  const maxRevenue = useMemo(() => {
    const max = Math.max(...reportData.map((item) => Number(item.revenue) || 0), 0);
    return max > 0 ? max : 1;
  }, [reportData]);

  // Quick date presets
  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(toLocalDateString(start));
    setEndDate(toLocalDateString(end));
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      alert('Không có dữ liệu để xuất file CSV');
      return;
    }

    let headers = [];
    let rows = [];

    if (activeTab === 'time') {
      headers = ['ThoiGian', 'SoDonDatVe', 'DoanhThu_VND'];
      rows = reportData.map((item) => [
        `"${item.period || item.date || ''}"`,
        getBookingCount(item),
        item.revenue || 0,
      ]);
    } else if (activeTab === 'movies') {
      headers = ['MaPhim', 'TenPhim', 'SoDonDatVe', 'DoanhThu_VND'];
      rows = reportData.map((item) => [
        item.movieId || item.movie?.id || '',
        `"${(item.movieTitle || item.movie?.title || '').replace(/"/g, '""')}"`,
        getBookingCount(item),
        item.revenue || 0,
      ]);
    } else if (activeTab === 'cinemas') {
      headers = ['MaRap', 'TenRap', 'ThanhPho', 'SoDonDatVe', 'DoanhThu_VND'];
      rows = reportData.map((item) => [
        item.cinemaId || item.cinema?.id || '',
        `"${(item.cinemaName || item.cinema?.name || '').replace(/"/g, '""')}"`,
        `"${(item.city || item.cinema?.city || '').replace(/"/g, '""')}"`,
        getBookingCount(item),
        item.revenue || 0,
      ]);
    }

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `BaoCao_CineBooking_${activeTab}_${startDate || 'tat_ca'}_${endDate || 'tat_ca'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-reports-page">
      <div className="admin-page-header">
        <div>
          <h2>Báo Cáo Doanh Thu</h2>
          <p>Thống kê hiệu quả kinh doanh theo thời gian, theo phim và theo từng cụm rạp</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleExportCSV}
          disabled={loading || reportData.length === 0}
        >
          📥 Xuất file CSV
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="reports-tab-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
          onClick={() => setActiveTab('time')}
        >
          📅 Theo thời gian (Ngày / Tháng)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          🎬 Theo từng Phim
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'cinemas' ? 'active' : ''}`}
          onClick={() => setActiveTab('cinemas')}
        >
          🏢 Theo Cụm Rạp
        </button>
      </div>

      {/* Date & Grouping Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Từ ngày:</label>
          <input
            type="date"
            className="admin-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <label className="admin-filter-label">Đến ngày:</label>
          <input
            type="date"
            className="admin-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {activeTab === 'time' && (
          <div className="admin-filter-group">
            <label className="admin-filter-label">Nhóm theo:</label>
            <select
              className="admin-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="day">Từng ngày</option>
              <option value="month">Từng tháng</option>
            </select>
          </div>
        )}

        <div className="admin-filter-group presets-group">
          <span className="admin-filter-label">Chọn nhanh:</span>
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePreset(7)}
          >
            7 ngày
          </button>
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePreset(30)}
          >
            30 ngày
          </button>
          <button
            type="button"
            className="preset-pill"
            onClick={() => handlePreset(90)}
          >
            3 tháng
          </button>
          <button
            type="button"
            className="preset-pill"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary for Selected Range */}
      <div className="report-summary-bar">
        <div className="report-stat-item">
          <span className="stat-label">Tổng doanh thu kỳ báo cáo:</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {formatVND(totalRevenue)}
          </span>
        </div>
        <div className="report-stat-item">
          <span className="stat-label">Tổng số lượt đặt vé:</span>
          <span className="stat-value">{totalBookings.toLocaleString('vi-VN')} đơn</span>
        </div>
        <div className="report-stat-item">
          <span className="stat-label">Số mục thống kê:</span>
          <span className="stat-value">{reportData.length}</span>
        </div>
      </div>

      {/* Data Visualization & Table */}
      {loading ? (
        <div className="admin-loading-card">
          <div className="spinner"></div>
          <p>Đang tổng hợp dữ liệu báo cáo...</p>
        </div>
      ) : error ? (
        <div className="admin-card admin-error-banner">
          <p>⚠️ {error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
          >
            Thử lại
          </button>
        </div>
      ) : reportData.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Không có dữ liệu phát sinh trong khoảng thời gian đã chọn
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrapper" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {activeTab === 'time' && <th>Thời gian</th>}
                  {activeTab === 'movies' && <th>Tên Phim</th>}
                  {activeTab === 'cinemas' && <th>Cụm Rạp</th>}
                  <th>Lượt đặt vé</th>
                  <th style={{ width: '35%' }}>Biểu đồ tỷ trọng doanh thu</th>
                  <th style={{ textAlign: 'right' }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, idx) => {
                  const revenueVal = Number(item.revenue) || 0;
                  const percent = maxRevenue > 0 ? (revenueVal / maxRevenue) * 100 : 0;
                  const bookingsVal = getBookingCount(item);

                  let label = '';
                  if (activeTab === 'time') {
                    label =
                      groupBy === 'month'
                        ? `Tháng ${item.period || item.date}`
                        : formatDateVN(item.period || item.date);
                  } else if (activeTab === 'movies') {
                    label = item.movie?.title || item.movieTitle || `Phim #${item.movieId}`;
                  } else if (activeTab === 'cinemas') {
                    label = `${item.cinema?.name || item.cinemaName || 'Rạp'} (${
                      item.cinema?.city || item.city || ''
                    })`;
                  }

                  return (
                    <tr key={idx}>
                      <td>
                        <strong>{label}</strong>
                      </td>
                      <td>{bookingsVal.toLocaleString('vi-VN')} đơn</td>
                      <td>
                        <div className="revenue-progress-container">
                          <div
                            className="revenue-progress-fill"
                            style={{ width: `${Math.max(4, percent)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                          {formatVND(revenueVal)}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
