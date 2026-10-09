import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ isAdminRoute = false }) {
  const { isLoggedIn, user, loading } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // (Assuming user object has an 'is_admin' property)
  if (isAdminRoute && (!user || !user.is_admin)) {
    return <Navigate to="/" replace />; 
    // return <div>Unauthorized access.</div>;
  }

  // If logged in (and admin status is okay), render the child route
  return <Outlet />; 
}

export default ProtectedRoute;