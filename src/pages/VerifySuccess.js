import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import '../styles/verification.css';

const VerifySuccess = () => {
  const navigate = useNavigate();
  const { user, markAsVerified } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // Mark user as verified when they land on this page
    markAsVerified();
    showToast('Email verified successfully!', 'success');
    
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [markAsVerified, navigate, showToast]);

  return (
    <div className="verify-success-verification-page">
      <div className="verify-success-verification-container verify-success-success">
        <div className="verify-success-verification-header">
          <div className="verify-success-verification-icon">
            <CheckCircle size={64} className="verify-success-icon-success" />
          </div>
          <h1>Email Verified!</h1>
          <p className="verify-success-verification-subtitle">
            Your email has been successfully verified
          </p>
        </div>

        <div className="verify-success-success-message">
          <p>Thank you for verifying your email address.</p>
          <p>You now have full access to all features:</p>
          <ul className="verify-success-success-features">
            <li>✅ Personalized shopping experience</li>
            <li>✅ Order history and tracking</li>
            <li>✅ Wishlist and saved items</li>
            <li>✅ Faster checkout process</li>
            <li>✅ Exclusive member discounts</li>
          </ul>
        </div>

        <div className="verify-success-verification-actions">
          <Link to="/" className="verify-success-btn verify-success-btn-primary verify-success-btn-block">
            <Home size={16} />
            Go to Homepage
          </Link>
          
          <Link to="/products" className="verify-success-btn verify-success-btn-outline verify-success-btn-block">
            <ShoppingBag size={16} />
            Start Shopping
          </Link>
        </div>

        <div className="verify-success-redirect-notice">
          <p>Redirecting to homepage in 5 seconds...</p>
        </div>
      </div>
    </div>
  );
};

export default VerifySuccess;