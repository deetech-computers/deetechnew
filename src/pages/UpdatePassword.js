// ========================================
// UPDATE PASSWORD PAGE (FIXED VERSION)
// ========================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/update-password.css';

// Toast Notification Component
const UpdatePasswordToast = ({ message, type = 'success', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'info': return 'i';
      case 'warning': return '⚠';
      default: return '✓';
    }
  };

  return (
    <div className={`update-password-toast update-toast-${type} ${isExiting ? 'update-toast-exiting' : ''}`}>
      <div className="update-toast-content">
        <div className="update-toast-icon">
          {getToastIcon()}
        </div>
        <span className="update-toast-message">{message}</span>
        <button onClick={handleClose} className="update-toast-close" aria-label="Close notification">
          ×
        </button>
      </div>
      <div className="update-toast-progress"></div>
    </div>
  );
};

const UpdatePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: 'red'
  });
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  const { updatePassword, loading, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL parameters for reset token and email
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const email = params.get('email');
    
    console.log('🔗 URL Parameters:', { token, email, hash: location.hash });
    
    // Store token and email from URL if present
    if (token) {
      setResetToken(token);
      console.log('✅ Reset token detected:', token.substring(0, 20) + '...');
    }
    
    if (email) {
      setResetEmail(email);
      console.log('✅ Reset email detected:', email);
    }
    
    // Check if this is a valid password reset flow
    const hasResetParams = token && email;
    const hasSupabaseRecovery = location.hash.includes('type=recovery');
    const isResetFlow = hasResetParams || hasSupabaseRecovery || isAuthenticated;
    
    if (!isResetFlow) {
      console.log('❌ Not a valid reset flow - redirecting to login');
      showToast('Please use the password reset link from your email', 'warning');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      console.log('✅ Valid password reset flow detected');
      if (hasResetParams) {
        showToast('Ready to set new password', 'info');
      }
    }
  }, [isAuthenticated, location, navigate]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Close toast notification
  const closeToast = () => {
    setToast(null);
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = 'red';

    if (!password) {
      return { score: 0, message: 'Enter a password', color: 'red' };
    }

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 5) {
      message = 'Strong password';
      color = 'green';
    } else if (score >= 3) {
      message = 'Moderate password';
      color = 'orange';
    } else {
      message = 'Weak password';
      color = 'red';
    }

    return { score, message, color };
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };








const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    console.log('🔄 Updating password...', { 
      hasToken: !!resetToken, 
      hasEmail: !!resetEmail,
      isAuthenticated,
      hash: window.location.hash
    });
    
    // Log the full URL for debugging
    console.log('🔗 Current URL:', window.location.href);
    
    // Pass resetToken and resetEmail to updatePassword
    const result = await updatePassword(newPassword, resetToken, resetEmail);
    
    if (result.success) {
      console.log('✅ Password updated successfully');
      showToast('Password updated successfully! You can now sign in.', 'success');
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      console.log('❌ Update failed:', result.message);
      
      // Special handling for different error types
      if (result.message?.includes('sign in')) {
        showToast('Please sign in to update password or use official reset link', 'warning');
      } else if (result.message?.includes('expired') || result.message?.includes('invalid')) {
        showToast('Reset link may be expired. Please request a new one.', 'error');
      } else {
        showToast(result.message || 'Failed to update password. Please try again.', 'error');
      }
    }
  } catch (error) {
    console.error('❌ Update password error:', error);
    showToast(error.message || 'Failed to update password. Please try again.', 'error');
  }
};







  const handlePasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleRequestNewLink = () => {
    showToast('Redirecting to password reset request...', 'info');
    setTimeout(() => {
      navigate('/forgot-password');
    }, 1500);
  };

  return (
    <div className="update-password-page">
      {toast && (
        <UpdatePasswordToast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
      <div className="update-password-container">
        <div className="update-password-header">
          <div className="update-password-logo">
            <Lock size={32} />
          </div>
          <h1>Set New Password</h1>
          <p className="update-password-subtitle">
            Choose a strong password to secure your account
          </p>
          
          {/* Show reset email if available */}
          {resetEmail && (
            <div className="reset-email-info">
              <p>
                <strong>Account:</strong> {resetEmail}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="update-password-form" noValidate>
          <div className="form-group">
            <label>
              <Lock size={16} /> New Password *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                className={errors.newPassword ? 'error' : ''}
                disabled={loading.resetPassword}
                autoFocus
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`strength-segment ${i <= passwordStrength.score ? `active ${passwordStrength.color}` : ''}`}
                    />
                  ))}
                </div>
                <span className={`strength-text strength-${passwordStrength.color}`}>
                  {passwordStrength.message}
                </span>
              </div>
            )}
            
            <div className="password-requirements">
              <h5>Password Requirements:</h5>
              <ul>
                <li className={newPassword.length >= 8 ? 'met' : ''}>
                  At least 8 characters long
                </li>
                <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>
                  One number
                </li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}>
                  One special character (optional)
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Confirm New Password *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={loading.resetPassword}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
            {newPassword === confirmPassword && confirmPassword && (
              <span className="success-message">
                <CheckCircle size={14} /> Passwords match
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading.resetPassword}
          >
            {loading.resetPassword ? (
              <>
                <span className="spinner"></span>
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        <div className="update-password-help">
          <div className="help-tips">
            <h4><AlertCircle size={16} /> Important Information:</h4>
            <ul>
              <li>Your reset link is valid for 1 hour</li>
              <li>Use a unique password for this account</li>
              <li>Avoid using personal information in passwords</li>
              <li>After updating, you'll be redirected to login</li>
            </ul>
          </div>
        </div>

        <div className="update-password-footer">
          <div className="footer-actions">
            <button
              onClick={handleRequestNewLink}
              className="btn btn-outline"
              style={{ marginBottom: '10px' }}
            >
              Need a new reset link?
            </button>
            
            <div className="footer-links">
              <button
                onClick={() => navigate('/login')}
                className="btn-link"
              >
                Back to Login
              </button>
              <span style={{ color: '#999', margin: '0 10px' }}>|</span>
              <button
                onClick={() => navigate('/')}
                className="btn-link"
              >
                Go to Homepage
              </button>
            </div>
          </div>
          
          <div className="security-note">
            <p>
              <strong>Note:</strong> For security reasons, please sign in with your new password 
              after updating. If you encounter issues, request a new reset link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;