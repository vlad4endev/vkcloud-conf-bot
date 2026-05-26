import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function AdminRoute() {
  const { isAdminMode } = useAdmin();

  if (!isAdminMode) {
    return <Navigate to="/" replace state={{ needAdminUnlock: true }} />;
  }

  return <Outlet />;
}
