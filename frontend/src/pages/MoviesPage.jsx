import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import movieService from '../services/movieService';
import MovieCard from '../components/common/MovieCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { LoadingSection } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import './MoviesPage.css';

const GENRES = [
  'Hành động',
  'Khoa học viễn tưởng',
  'Hoạt hình',
  'Hài hước',
  'Kinh dị',
  'Bí ẩn',
  'Phiêu lưu',
  'Drama',
];

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'now_showing';
  const selectedGenre = searchParams.get('genre') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const updateFilters = (newTab, newGenre, newPage) => {
    const params = new URLSearchParams();
    if (newTab) params.set('tab', newTab);
    if (newGenre) params.set('genre', newGenre);
    if (newPage && newPage > 1) params.set('page', newPage.toString());
    setLoading(true);
    setSearchParams(params);
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        // Query movies strictly according to the active status and filters
        // No fallback fetching all movies when now_showing is empty!
        const res = await movieService.getMovies({
          status: activeTab,
          genre: selectedGenre || undefined,
          page: currentPage,
          limit: 12,
        });

        if (ignore) return;

        setMovies(res.movies || []);
        setTotalPages(res.totalPages || 1);
        setTotalMovies(res.total || 0);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải danh sách phim');
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
  }, [activeTab, selectedGenre, currentPage, reloadKey]);

  const handleTabChange = (tab) => {
    updateFilters(tab, selectedGenre, 1);
  };

  const handleGenreChange = (e) => {
    const genre = e.target.value;
    updateFilters(activeTab, genre, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    updateFilters(activeTab, selectedGenre, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <Breadcrumbs
        items={[
          {
            label: activeTab === 'now_showing' ? 'Phim đang chiếu' : 'Phim sắp chiếu',
          },
        ]}
      />

      <main className="container movies-page">
        <div className="movies-page-header">
          <h1 className="movies-page-title">Danh Sách Phim</h1>
        </div>

        {/* Tab & Filter Bar */}
        <div className="movies-filter-bar">
          <div className="movies-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'now_showing'}
              className={`movies-tab-btn ${activeTab === 'now_showing' ? 'active' : ''}`}
              onClick={() => handleTabChange('now_showing')}
            >
              Đang chiếu
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'coming_soon'}
              className={`movies-tab-btn ${activeTab === 'coming_soon' ? 'active' : ''}`}
              onClick={() => handleTabChange('coming_soon')}
            >
              Sắp chiếu
            </button>
          </div>

          <div className="genre-filter-wrapper">
            <label htmlFor="genre-select" className="genre-filter-label">
              Thể loại:
            </label>
            <select
              id="genre-select"
              className="genre-select"
              value={selectedGenre}
              onChange={handleGenreChange}
            >
              <option value="">Tất cả thể loại</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <LoadingSection text="Đang lọc danh sách phim..." minHeight="360px" />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} minHeight="300px" />
        ) : movies.length > 0 ? (
          <>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Hiển thị <strong>{movies.length}</strong> / {totalMovies} phim
            </div>

            <div className="movie-grid">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`page-btn ${p === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="🎬"
            title="Không tìm thấy phim phù hợp"
            message={
              selectedGenre
                ? `Không có phim thể loại "${selectedGenre}" trong danh mục ${activeTab === 'now_showing' ? 'đang chiếu' : 'sắp chiếu'}.`
                : `Hiện chưa có phim nào trong danh mục ${activeTab === 'now_showing' ? 'đang chiếu' : 'sắp chiếu'}.`
            }
            actionText={selectedGenre ? 'Xóa bộ lọc thể loại' : undefined}
            onAction={
              selectedGenre
                ? () => {
                    updateFilters(activeTab, '', 1);
                  }
                : undefined
            }
          />
        )}
      </main>
    </>
  );
}
