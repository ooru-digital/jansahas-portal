import { Navigate, Outlet } from 'react-router-dom';

interface AuthLayoutProps {
  isAuthenticated: boolean;
}

export default function AuthLayout({ isAuthenticated }: AuthLayoutProps) {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}