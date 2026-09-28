import { Navigate, useLocation, Outlet } from 'react-router';
import useAuth from '../../context/useAuth';
import { LoadingSection } from './LoadingState';

/**
 * Route Guard for Admin-only areas (/admin/*)
 * Waits for session verification, redirects unauthenticated users to /login,
 * and restricts non-admin users to /forbidden.
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="container" style={{ padding: 'var(--space-16) 0' }}>
        <LoadingSection text="Đang xác minh quyền quản trị..." minHeight="300px" />
      </main>
    );
  }

  if (!isAuthenticated) {
    // Preserve target location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/forbidden" replace />;
  }

  return children ? children : <Outlet />;
}
