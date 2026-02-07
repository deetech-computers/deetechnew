// components/Auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireVerification = false 
}) => {
  const { 
    user, 
    authInitialized, 
    loading, 
    isAdmin, 
    isVerified,
    needsVerification 
  } = useAuth();

  // Wait for auth to initialize
  if (!authInitialized || loading.auth) {
    return (
      <div className="auth-loading">
        <LoadingSpinner />
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs verification
  if (requireVerification && needsVerification && !isVerified()) {
    // Redirect to verification page
    return <Navigate to="/verify-email" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and verified/admin if required)
  return children;
};

export default ProtectedRoute;