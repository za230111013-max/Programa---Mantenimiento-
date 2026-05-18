import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function ProtectedRoute({ allowedRoles }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // RBAC: If allowedRoles is specified, check if user's role is allowed
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
