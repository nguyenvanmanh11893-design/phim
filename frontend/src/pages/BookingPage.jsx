import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import useAuth from '../context/useAuth';
import showtimeService from '../services/showtimeService';
import bookingService from '../services/bookingService';
import comboService from '../services/comboService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import SeatMap from '../components/booking/SeatMap';
import ComboSelector from '../components/booking/ComboSelector';
import BookingSummary from '../components/booking/BookingSummary';
import './BookingPage.css';

function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}

export default function BookingPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [showtimeDetail, setShowtimeDetail] = useState(null);
  const [seatMapData, setSeatMapData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Combos state
  const [combos, setCombos] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState({});
  const [comboLoading, setComboLoading] = useState(true);
  const [comboError, setComboError] = useState(null);

  // Page status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [draftNotice, setDraftNotice] = useState(null);

  const draftKey = `cine_draft_booking_${showtimeId}`;

  // Fetch showtime and seat map
  useEffect(() => {
    let ignore = false;

    async function loadShowtimeAndSeats() {
      try {
        const [showtimeData, seatData] = await Promise.all([
          showtimeService.getShowtimeById(showtimeId),
          bookingService.getSeatMap(showtimeId),
        ]);

        if (ignore) return;

        setShowtimeDetail(showtimeData);
        setSeatMapData(seatData);
        setError(null);

        // Check if showtime is bookable
        if (showtimeData.status === 'CANCELLED') {
          setError('Suất chiếu này đã bị huỷ. Không thể đặt vé.');
          return;
        }
        if (showtimeData.status === 'ENDED') {
          setError('Suất chiếu này đã kết thúc. Vui lòng chọn suất chiếu khác.');
          return;
        }

        // Restore and re-validate draft selection if exists
        try {
          const rawDraft = sessionStorage.getItem(draftKey);
          if (rawDraft) {
            const draft = JSON.parse(rawDraft);
            const allSeats = Object.values(seatData.seatMap || {}).flat();

            if (Array.isArray(draft.seatIds) && draft.seatIds.length > 0) {
              const validSeats = [];
              let hadConflict = false;

              draft.seatIds.forEach((id) => {
                const foundSeat = allSeats.find((s) => s.id === Number(id));
                if (foundSeat && foundSeat.status === 'AVAILABLE') {
                  validSeats.push(foundSeat);
                } else {
                  hadConflict = true;
                }
              });

              setSelectedSeats(validSeats);
              if (hadConflict) {
                setDraftNotice(
                  'Một số ghế bạn đã chọn trước đó không còn khả dụng và đã được tự động bỏ chọn.'
                );
              }
            }

            if (draft.selectedCombos && typeof draft.selectedCombos === 'object') {
              setSelectedCombos(draft.selectedCombos);
            }
          }
        } catch {
          // Ignore draft parsing errors
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải thông tin suất chiếu và sơ đồ ghế.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadShowtimeAndSeats();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      ignore = true;
    };
  }, [showtimeId, reloadKey, draftKey]);

  // Fetch combos
  const [comboReloadKey, setComboReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function fetchCombos() {
      try {
        const activeCombos = await comboService.getAllActiveCombos();
        if (ignore) return;
        setCombos(activeCombos || []);
        setComboError(null);
      } catch (err) {
        if (!ignore) {
          setComboError(err.message || 'Không thể tải danh sách combo bắp nước.');
        }
      } finally {
        if (!ignore) {
          setComboLoading(false);
        }
      }
    }

    fetchCombos();

    return () => {
      ignore = true;
    };
  }, [comboReloadKey]);

  const handleRetryCombos = () => {
    setComboLoading(true);
    setComboReloadKey((k) => k + 1);
  };

  // Persist draft to sessionStorage whenever selectedSeats or selectedCombos changes
  useEffect(() => {
    if (!loading && showtimeId) {
      try {
        if (selectedSeats.length > 0 || Object.keys(selectedCombos).length > 0) {
          const draft = {
            showtimeId: Number(showtimeId),
            seatIds: selectedSeats.map((s) => s.id),
            selectedCombos,
          };
          sessionStorage.setItem(draftKey, JSON.stringify(draft));
        } else {
          sessionStorage.removeItem(draftKey);
        }
      } catch {
        // Storage quota / error ignored
      }
    }
  }, [selectedSeats, selectedCombos, showtimeId, loading, draftKey]);

  // Toggle seat selection (1 to 8 seats)
  const handleToggleSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setServerError(null);

    const exists = selectedSeats.some((s) => s.id === seat.id);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        setServerError('Mỗi giao dịch chỉ được chọn tối đa 8 ghế theo quy định.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Change combo quantity
  const handleComboQuantityChange = (comboId, qty) => {
    setServerError(null);
    setSelectedCombos((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[comboId];
      } else {
        next[comboId] = qty;
      }
      return next;
    });
  };

  // Submit booking creation
  const handleCreateBooking = async () => {
    setServerError(null);

    if (selectedSeats.length === 0) {
      setServerError('Vui lòng chọn ít nhất 1 ghế.');
      return;
    }

    if (selectedSeats.length > 8) {
      setServerError('Mỗi giao dịch chỉ được chọn tối đa 8 ghế.');
      return;
    }

    // Nếu chưa đăng nhập: lưu draft và chuyển tới trang login kèm redirect quay lại
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const comboItems = Object.entries(selectedCombos)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([cId, qty]) => ({
          comboId: Number(cId),
          quantity: Number(qty),
        }));

      const newBooking = await bookingService.createBooking({
        showtimeId: Number(showtimeId),
        seatIds: selectedSeats.map((s) => Number(s.id)),
        comboItems,
      });

      // Tạo booking thành công -> Xóa bản nháp
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // Ignored
      }

      // Điều hướng đến trang chi tiết booking vừa tạo
      navigate(`/bookings/${newBooking.id}`);
    } catch (err) {
      // Nếu lỗi 409 Conflict (ghế đã bị đặt hoặc đang giữ bởi người khác)
      if (err.status === 409) {
        setServerError(
          'Một số ghế bạn chọn vừa được người khác giữ hoặc đặt trước. Hệ thống đã cập nhật lại sơ đồ ghế.'
        );
        // Tải lại seat map để đồng bộ ghế mới nhất
        try {
          const freshSeatData = await bookingService.getSeatMap(showtimeId);
          setSeatMapData(freshSeatData);
          const allFreshSeats = Object.values(freshSeatData.seatMap || {}).flat();
          // Loại bỏ những ghế không còn AVAILABLE
          setSelectedSeats((prev) =>
            prev.filter((ps) => {
              const fresh = allFreshSeats.find((fs) => fs.id === ps.id);
              return fresh && fresh.status === 'AVAILABLE';
            })
          );
        } catch {
          // Ignored
        }
      } else {
        setServerError(err.message || 'Không thể tạo đơn đặt vé. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  // Estimated price for mobile bar
  const estimatedTotalPrice = useMemo(() => {
    const seatsTotal = selectedSeats.reduce(
      (sum, seat) => sum + (Number(seat.price) || 0),
      0
    );
    const combosTotal = Object.entries(selectedCombos).reduce((sum, [cId, qty]) => {
      const combo = combos.find((c) => c.id === Number(cId));
      return sum + (Number(combo?.price) || 0) * Number(qty);
    }, 0);
    return seatsTotal + combosTotal;
  }, [selectedSeats, selectedCombos, combos]);

  if (loading) {
    return (
      <main className="container booking-page" style={{ paddingTop: 'var(--space-8)' }}>
        <LoadingSection text="Đang tải sơ đồ ghế phòng chiếu..." minHeight="420px" />
      </main>
    );
  }

  if (error || !showtimeDetail) {
    return (
      <main className="container booking-page" style={{ paddingTop: 'var(--space-8)' }}>
        <ErrorState
          message={error || 'Không tìm thấy thông tin suất chiếu.'}
          onRetry={handleRetry}
          minHeight="360px"
        />
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
        </div>
      </main>
    );
  }

  const { movie } = showtimeDetail;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Phim', to: '/movies' },
          { label: movie?.title || 'Chi tiết phim', to: `/movies/${movie?.id}` },
          { label: 'Chọn ghế & Combo' },
        ]}
      />

      <main className="container booking-page">
        {/* Top Header Bar */}
        <div className="booking-top-bar">
          <button
            type="button"
            className="booking-back-btn"
            onClick={() => navigate(-1)}
          >
            ‹ Quay lại
          </button>
          <h1 className="booking-page-heading">Mua vé xem phim</h1>
          <div style={{ width: '80px' }} />
        </div>

        {/* Notice from restored draft */}
        {draftNotice && (
          <div
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              color: '#facc15',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>ℹ️ {draftNotice}</span>
            <button
              type="button"
              onClick={() => setDraftNotice(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#facc15',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="booking-layout-grid">
          {/* Left Column: Seat Map + Combo Selector */}
          <div className="booking-left-column">
            {/* Seat Map */}
            <SeatMap
              seatMap={seatMapData?.seatMap || {}}
              selectedSeats={selectedSeats}
              onToggleSeat={handleToggleSeat}
              maxSeats={8}
            />

            {/* Combo Selection */}
            <ComboSelector
              combos={combos}
              selectedCombos={selectedCombos}
              onQuantityChange={handleComboQuantityChange}
              loading={comboLoading}
              error={comboError}
              onRetry={handleRetryCombos}
            />
          </div>

          {/* Right Column: Order Summary Sidebar (Desktop) */}
          <BookingSummary
            showtimeDetail={showtimeDetail}
            selectedSeats={selectedSeats}
            combos={combos}
            selectedCombos={selectedCombos}
            isSubmitting={isSubmitting}
            onSubmit={handleCreateBooking}
            serverError={serverError}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Sticky Bottom Bar for Mobile */}
        <div className="booking-sticky-bottom-bar">
          <div className="bottom-bar-inner">
            <div className="bottom-bar-info">
              <span className="bottom-bar-seats">
                {selectedSeats.length > 0
                  ? `Ghế (${selectedSeats.length}): ${selectedSeats.map((s) => s.label || `${s.row}${s.number}`).join(', ')}`
                  : 'Chưa chọn ghế'}
              </span>
              <span className="bottom-bar-price">{formatVND(estimatedTotalPrice)}</span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedSeats.length === 0 || isSubmitting}
              onClick={handleCreateBooking}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : !isAuthenticated
                  ? 'Đăng nhập'
                  : 'Đặt vé'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
