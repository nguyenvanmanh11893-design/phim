import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { cinemaService } from '../../services/cinemaService';
import './AdminSeatsPage.css';

export default function AdminSeatsPage() {
  const { roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [seatMap, setSeatMap] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Selected seat for editing
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [savingSeat, setSavingSeat] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Edit form state
  const [seatType, setSeatType] = useState('NORMAL');
  const [seatIsActive, setSeatIsActive] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadSeats() {
      try {
        const data = await cinemaService.getSeatsByRoom(roomId);
        if (ignore) return;
        if (data) {
          setRoom(data.room || null);
          setSeatMap(data.seatMap || {});
          setSummary(data.summary || null);
        }
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Lỗi khi tải sơ đồ ghế phòng chiếu');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSeats();
    return () => {
      ignore = true;
    };
  }, [roomId, reloadKey]);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setSeatType(seat.type);
    setSeatIsActive(seat.isActive);
    setSaveSuccessMsg(null);
  };

  const handleUpdateSeat = async (e) => {
    e.preventDefault();
    if (!selectedSeat) return;

    setSavingSeat(true);
    setSaveSuccessMsg(null);
    try {
      const updated = await cinemaService.updateSeat(selectedSeat.id, {
        type: seatType,
        isActive: seatIsActive,
      });

      // Update seat in local seatMap
      setSeatMap((prev) => {
        const next = { ...prev };
        const rowSeats = next[selectedSeat.row] || [];
        next[selectedSeat.row] = rowSeats.map((s) =>
          s.id === selectedSeat.id
            ? { ...s, type: updated.type, isActive: updated.isActive }
            : s
        );
        return next;
      });

      setSelectedSeat((prev) => ({
        ...prev,
        type: updated.type,
        isActive: updated.isActive,
      }));

      // Update summary
      setSummary((prev) => {
        if (!prev) return prev;
        const oldType = selectedSeat.type;
        const newType = updated.type;
        const oldActive = selectedSeat.isActive;
        const newActive = updated.isActive;

        let normalCount = prev.normal || 0;
        let vipCount = prev.vip || 0;
        let coupleCount = prev.couple || 0;
        let activeCount = prev.active || 0;
        let inactiveCount = prev.inactive || 0;

        if (oldType === 'NORMAL') normalCount--;
        if (oldType === 'VIP') vipCount--;
        if (oldType === 'COUPLE') coupleCount--;

        if (newType === 'NORMAL') normalCount++;
        if (newType === 'VIP') vipCount++;
        if (newType === 'COUPLE') coupleCount++;

        if (oldActive && !newActive) {
          activeCount--;
          inactiveCount++;
        } else if (!oldActive && newActive) {
          activeCount++;
          inactiveCount--;
        }

        return {
          ...prev,
          normal: normalCount,
          vip: vipCount,
          couple: coupleCount,
          active: activeCount,
          inactive: inactiveCount,
        };
      });

      setSaveSuccessMsg(`Đã cập nhật ghế ${selectedSeat.row}${selectedSeat.number}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Lỗi khi cập nhật ghế: ${err.message}`);
    } finally {
      setSavingSeat(false);
    }
  };

  const rows = Object.keys(seatMap).sort();

  return (
    <div className="admin-seats-page">
      {/* Breadcrumbs */}
      <div className="admin-breadcrumbs">
        <Link to="/admin/cinemas">← Danh sách cụm rạp</Link>
        <span>/</span>
        {room?.cinemaId ? (
          <Link to={`/admin/cinemas/${room.cinemaId}/rooms`}>Danh sách phòng</Link>
        ) : (
          <span>Phòng chiếu</span>
        )}
        <span>/</span>
        <span className="current-crumb">Sơ đồ ghế: {room?.name || `Phòng #${roomId}`}</span>
      </div>

      <div className="admin-page-header">
        <div>
          <h2>Cấu hình Sơ đồ Ghế — {room?.name || '...'}</h2>
          <p>
            Định dạng: <span className="admin-pill admin-pill-info">{room?.type || '2D'}</span> |
            Kích thước: {room?.totalRows} hàng × {room?.seatsPerRow} ghế
          </p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-card">
          <div className="spinner"></div>
          <p>Đang tải sơ đồ ghế...</p>
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
      ) : (
        <div className="admin-seats-layout">
          {/* Main Visual Seat Map Container */}
          <div className="seat-map-main-area">
            {/* Summary Metrics */}
            <div className="seat-summary-grid">
              <div className="seat-metric-pill total">
                <span>Tổng số ghế:</span>
                <strong>{summary?.total || 0}</strong>
              </div>
              <div className="seat-metric-pill normal">
                <span>Ghế thường:</span>
                <strong>{summary?.normal || 0}</strong>
              </div>
              <div className="seat-metric-pill vip">
                <span>Ghế VIP:</span>
                <strong>{summary?.vip || 0}</strong>
              </div>
              <div className="seat-metric-pill couple">
                <span>Ghế đôi:</span>
                <strong>{summary?.couple || 0}</strong>
              </div>
              <div className="seat-metric-pill inactive">
                <span>Khóa/Hỏng:</span>
                <strong>{summary?.inactive || 0}</strong>
              </div>
            </div>

            {/* Screen representation */}
            <div className="admin-screen-container">
              <div className="admin-screen-arc"></div>
              <span className="admin-screen-label">MÀN HÌNH / SCREEN</span>
            </div>

            {/* Seat Grid */}
            <div className="admin-seat-grid-container">
              <div className="admin-seat-grid">
                {rows.map((rowKey) => {
                  const seatsInRow = seatMap[rowKey] || [];
                  return (
                    <div key={rowKey} className="admin-seat-row">
                      <span className="row-label">{rowKey}</span>
                      <div className="row-seats">
                        {seatsInRow.map((seat) => {
                          const isSelected = selectedSeat?.id === seat.id;
                          const seatClass = [
                            'seat-node',
                            `type-${seat.type.toLowerCase()}`,
                            !seat.isActive ? 'is-inactive' : '',
                            isSelected ? 'is-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              className={seatClass}
                              onClick={() => handleSeatClick(seat)}
                              title={`Ghế ${seat.row}${seat.number} (${seat.type}) - ${
                                seat.isActive ? 'Đang hoạt động' : 'Tạm khóa'
                              }`}
                            >
                              <span className="seat-number">{seat.number}</span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="row-label">{rowKey}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="admin-seat-legend">
              <div className="legend-item">
                <span className="legend-box type-normal"></span>
                <span>Ghế chuẩn (NORMAL)</span>
              </div>
              <div className="legend-item">
                <span className="legend-box type-vip"></span>
                <span>Ghế VIP</span>
              </div>
              <div className="legend-item">
                <span className="legend-box type-couple"></span>
                <span>Ghế đôi (COUPLE)</span>
              </div>
              <div className="legend-item">
                <span className="legend-box is-inactive"></span>
                <span>Tạm khóa / Hỏng</span>
              </div>
            </div>
          </div>

          {/* Right Inspector Panel */}
          <aside className="seat-inspector-panel">
            <div className="admin-card">
              <h3>⚙️ Chi tiết ghế</h3>

              {selectedSeat ? (
                <form onSubmit={handleUpdateSeat} className="seat-edit-form">
                  <div className="selected-seat-badge">
                    <span className="seat-code">
                      {selectedSeat.row}
                      {selectedSeat.number}
                    </span>
                    <span className="seat-id">ID: #{selectedSeat.id}</span>
                  </div>

                  {saveSuccessMsg && (
                    <div className="seat-save-success">✓ {saveSuccessMsg}</div>
                  )}

                  <div className="admin-form-group">
                    <label>Loại ghế:</label>
                    <div className="seat-type-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="seatType"
                          value="NORMAL"
                          checked={seatType === 'NORMAL'}
                          onChange={() => setSeatType('NORMAL')}
                        />
                        <span>Ghế thường (Standard)</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="seatType"
                          value="VIP"
                          checked={seatType === 'VIP'}
                          onChange={() => setSeatType('VIP')}
                        />
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>Ghế VIP</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="seatType"
                          value="COUPLE"
                          checked={seatType === 'COUPLE'}
                          onChange={() => setSeatType('COUPLE')}
                        />
                        <span style={{ color: '#ec4899', fontWeight: 600 }}>
                          Ghế đôi (Couple)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Trạng thái hoạt động:</label>
                    <label className="switch-toggle-label">
                      <input
                        type="checkbox"
                        checked={seatIsActive}
                        onChange={(e) => setSeatIsActive(e.target.checked)}
                      />
                      <span>
                        {seatIsActive ? '🟢 Đang hoạt động' : '🔴 Tạm khóa / Hỏng ghế'}
                      </span>
                    </label>
                    <span className="admin-form-help">
                      Ghế bị khóa sẽ không hiển thị cho khách hàng chọn khi đặt vé.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={savingSeat}
                  >
                    {savingSeat ? 'Đang cập nhật...' : 'Lưu cấu hình ghế'}
                  </button>
                </form>
              ) : (
                <div className="no-seat-selected">
                  <span>👆</span>
                  <p>Bấm chọn một ghế trên sơ đồ để xem thông tin và đổi loại ghế</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
