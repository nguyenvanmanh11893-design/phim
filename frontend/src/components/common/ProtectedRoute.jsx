import { Navigate, useLocation } from 'react-router';
import useAuth from '../../context/useAuth';
import { LoadingSection } from './LoadingState';

/**
 * Route Guard for authenticated pages
 * Waits for initial session verification to finish before deciding redirection
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="container" style={{ padding: 'var(--space-16) 0' }}>
        <LoadingSection text="Đang xác thực phiên đăng nhập..." minHeight="300px" />
      </main>
    );
  }

  if (!isAuthenticated) {
    // Preserve current internal location in state for seamless redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
