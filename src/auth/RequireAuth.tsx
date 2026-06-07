import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStorage } from '../api/token-storage';

export function RequireAuth() {
  const location = useLocation();
  if (!tokenStorage.get()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
