// VerificationBanner.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, X } from 'lucide-react';
import './VerificationBanner.css';

const VerificationBanner = () => {
  const { user, isVerified, needsVerification } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible || !needsVerification || isVerified()) {
    return null;
  }

  return (
    <div className="verification-banner">
      <div className="verification-banner-content">
        <Mail size={20} />
        <div>
          <strong>Verify your email to unlock full features!</strong>
          <p>Please check your inbox to verify {user?.email}</p>
        </div>
      </div>
      <div className="verification-banner-actions">
        <button 
          onClick={() => navigate('/verify-email')}
          className="btn-verify"
        >
          Verify Now
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="btn-dismiss"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default VerificationBanner;