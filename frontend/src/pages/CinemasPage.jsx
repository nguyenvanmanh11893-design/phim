import { useState, useEffect } from 'react';
import cinemaService from '../services/cinemaService';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import './CinemasPage.css';

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await cinemaService.getCinemas({ limit: 50 });
        if (ignore) return;
        setCinemas(res.cinemas || []);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải danh sách cụm rạp.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Rạp chiếu' }]} />

      <main className="container cinemas-page">
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Hệ Thống Rạp Chiếu CineBooking
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Trải nghiệm rạp chiếu tiêu chuẩn cao với hệ thống âm thanh, màn chiếu hiện đại.
        </p>

        {loading ? (
          <LoadingSection text="Đang tải danh sách rạp chiếu..." minHeight="320px" />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} minHeight="280px" />
        ) : cinemas.length > 0 ? (
          <div className="cinemas-grid">
            {cinemas.map((cinema) => (
              <div key={cinema.id} className="cinema-card">
                <h3 className="cinema-card-name">
                  <span>🏢</span>
                  <span>{cinema.name}</span>
                </h3>

                <div className="cinema-card-detail">
                  <span>📍</span>
                  <span>
                    {cinema.address}, {cinema.city}
                  </span>
                </div>

                {cinema.phone && (
                  <div className="cinema-card-detail">
                    <span>📞</span>
                    <span>Hotline: {cinema.phone}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🏢"
            title="Chưa có dữ liệu rạp"
            message="Hệ thống đang mở rộng và cập nhật các cụm rạp mới."
          />
        )}
      </main>
    </>
  );
}
