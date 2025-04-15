// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// allowedRoles is an array, e.g., ['admin'] or ['admin', 'manager']
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading indicator while auth state is being determined
    return <div>Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page
    // Pass the current location so we can redirect back after login (optional)
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but doesn't have the required role
    // Redirect to a "Not Authorized" page or the home page
    console.warn(`User with role '${user.role}' tried to access restricted route.`);
    return <Navigate to="/" replace />; // Redirect to home page
  }

  // User is authenticated and has the required role (or no specific role is required)
  // Render the child component passed to this route
  return <Outlet />;
}

export default ProtectedRoute;