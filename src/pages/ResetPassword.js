import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import '../styles/forgot-password.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('🔐 ResetPassword: Checking auth state...');
        
        // Simple check: Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('🔐 Session error:', sessionError);
          setIsValid(false);
          setChecking(false);
          return;
        }
        
        if (session?.user) {
          console.log('🔐 User authenticated:', session.user.email);
          setUserEmail(session.user.email);
          setIsValid(true);
        } else {
          console.log('🔐 No authenticated user');
          setIsValid(false);
          
          // Check if there's an error in the URL (expired link)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const errorMsg = hashParams.get('error_description');
          
          if (errorMsg) {
            console.log('🔐 URL error found:', errorMsg);
            setError(decodeURIComponent(errorMsg));
          }
        }
      } catch (error) {
        console.error('🔐 Auth check error:', error);
        setIsValid(false);
      } finally {
        setChecking(false);
      }
    };
    
    checkAuthState();
  }, []);

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsUpdating(true);
    
    try {
      console.log('🔐 Updating password for:', userEmail);
      
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('🔐 Update error:', updateError);
        setError('Failed to update password. Please request a new reset link.');
        showToast('Password update failed. Please try again.', 'error');
        return;
      }

      console.log('✅ Password updated successfully');
      showToast('Password updated successfully! Please sign in.', 'success');
      
      // Sign out and redirect
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password changed successfully! Please sign in with your new password.',
            type: 'success'
          } 
        });
      }, 1500);
      
    } catch (error) {
      console.error('🔐 Update exception:', error);
      setError('An error occurred. Please try again.');
      showToast('Unable to update password. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (checking) {
    return (
      <div className="forgot-auth-page">
        <div className="forgot-auth-container">
          <div className="forgot-auth-header">
            <div className="forgot-auth-logo">
              <Loader2 className="animate-spin" size={32} />
            </div>
            <h1>Checking Session</h1>
            <p className="forgot-auth-subtitle">Please wait...</p>
          </div>
          <div className="checking-spinner">
            <div className="spinner"></div>
            <p>Verifying your authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="forgot-auth-page">
        <div className="forgot-auth-container">
          <div className="forgot-auth-header">
            <div className="forgot-auth-logo">
              <AlertCircle size={32} />
            </div>
            <h1>Session Required</h1>
            <p className="forgot-auth-subtitle">
              You need to authenticate first
            </p>
          </div>

          <div className="error-message-box">
            <AlertCircle size={24} />
            <div>
              <h4>How to reset your password:</h4>
              <ol>
                <li>Go to the login page and click "Forgot Password"</li>
                <li>Enter your email address</li>
                <li>Check your email for a reset link</li>
                <li>
                  <strong>Click the link directly from your email</strong> - don't copy and paste
                </li>
                <li>You'll be redirected here to create a new password</li>
              </ol>
              
              {error && (
                <div className="specific-error">
                  <h5>Error Details:</h5>
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => navigate('/forgot-password')}
              className="btn btn-primary btn-block"
            >
              Request New Reset Link
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-outline btn-block"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-auth-page">
      <div className="forgot-auth-container">
        <div className="forgot-auth-header">
          <div className="forgot-auth-logo">
            <Lock size={32} />
          </div>
          <h1>Create New Password</h1>
          <p className="forgot-auth-subtitle">
            {userEmail ? `Reset password for: ${userEmail}` : 'Choose a new password'}
          </p>
        </div>

        <div className="forgot-auth-form-wrapper">
          <div className="form-group">
            <label>
              <Lock size={16} /> New Password *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter new password"
                required
                autoFocus
                disabled={isUpdating}
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isUpdating}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="form-hint">Minimum 6 characters</p>
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Confirm Password *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="Confirm new password"
                required
                disabled={isUpdating}
                minLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                disabled={isUpdating}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message-box">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <button 
            onClick={handleSubmit}
            className="btn btn-primary btn-block"
            disabled={isUpdating || !newPassword || !confirmPassword}
          >
            {isUpdating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Updating Password...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Update Password
              </>
            )}
          </button>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => navigate('/forgot-password')}
            className="btn btn-outline btn-block"
            disabled={isUpdating}
          >
            Request New Link
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-secondary btn-block"
            disabled={isUpdating}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;