import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, getHomeRouteByRole } from '../contexts/AuthContext';

const ProtectedRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">
        <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
