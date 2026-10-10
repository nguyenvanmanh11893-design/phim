import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import CinemasPage from './pages/CinemasPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentResultPage from './pages/PaymentResultPage';
import TicketPage from './pages/TicketPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminMoviesPage from './pages/admin/AdminMoviesPage';
import AdminCinemasPage from './pages/admin/AdminCinemasPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminSeatsPage from './pages/admin/AdminSeatsPage';
import AdminShowtimesPage from './pages/admin/AdminShowtimesPage';
import AdminCombosPage from './pages/admin/AdminCombosPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminRatingsPage from './pages/admin/AdminRatingsPage';

import ErrorBoundary from './components/common/ErrorBoundary';

/**
 * Customer Layout with public Header and Footer
 */
function CustomerLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flex: '1 0 auto' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin Portal (Isolated layout, NO customer Header/Footer) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="cinemas" element={<AdminCinemasPage />} />
            <Route path="cinemas/:cinemaId/rooms" element={<AdminRoomsPage />} />
            <Route path="rooms/:roomId/seats" element={<AdminSeatsPage />} />
            <Route path="showtimes" element={<AdminShowtimesPage />} />
            <Route path="combos" element={<AdminCombosPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="report" element={<Navigate to="/admin/reports" replace />} />
            <Route path="ratings" element={<AdminRatingsPage />} />
          </Route>

          {/* Customer Application (Standard Header and Footer) */}
          <Route element={<CustomerLayout />}>
            {/* Public browsing routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movies/:id" element={<MovieDetailPage />} />
            <Route path="/cinemas" element={<CinemasPage />} />
            <Route path="/booking/:showtimeId" element={<BookingPage />} />

            {/* Authentication routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Authenticated user routes protected by route guard */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/my-booking" element={<Navigate to="/my-bookings" replace />} />
            <Route
              path="/bookings/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:bookingId"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-result"
              element={
                <ProtectedRoute>
                  <PaymentResultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:bookingId"
              element={
                <ProtectedRoute>
                  <TicketPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
