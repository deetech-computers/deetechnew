// components/VerifiedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerifiedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Allow access to verification-related pages
  const allowedPaths = ['/verify-email', '/auth/callback', '/resend-verification'];
  
  if (allowedPaths.includes(location.pathname)) {
    return children;
  }
  
  // Check if user is authenticated but not verified
  if (user && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }
  
  return children;
};

export default VerifiedRoute;