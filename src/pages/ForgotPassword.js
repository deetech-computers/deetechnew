import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft, Key, Shield, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import '../styles/forgot-password.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { sendPasswordResetEmail, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    setEmail(normalizedEmail);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Rate limiting check (optional)
    if (attempts >= 3) {
      setError('Too many attempts. Please wait a few minutes.');
      return;
    }
    
    console.log('🔐 Requesting password reset for:', normalizedEmail);
    console.log('🔐 Current origin:', window.location.origin);
    
    try {
      const result = await sendPasswordResetEmail(normalizedEmail);
      
      console.log('🔐 Reset request result:', result);
      
      if (result.success) {
        setAttempts(prev => prev + 1);
        setSubmitted(true);
        
        // Clear error if successful
        setError('');
      } else {
        // The error is already shown via toast in sendPasswordResetEmail
        // But we can add additional logic here if needed
      }
    } catch (err) {
      console.error('🔐 Reset request exception:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleTryDifferentEmail = () => {
    setSubmitted(false);
    setEmail('');
    setError('');
  };

  const handleResendEmail = async () => {
    if (!email.trim()) {
      setError('Please enter an email address first');
      setSubmitted(false);
      return;
    }
    
    console.log('🔐 Resending reset email to:', email);
    await sendPasswordResetEmail(email);
  };

  if (submitted) {
    return (
      <div className="forgot-auth-page">
        <div className="forgot-auth-container">
          <div className="forgot-auth-header success">
            <div className="forgot-auth-logo success">
              <CheckCircle2 size={32} />
            </div>
            <h1>Check Your Email</h1>
            <p className="forgot-auth-subtitle">
              Password reset instructions sent to <strong>{email}</strong>
            </p>
          </div>

          <div className="success-message-box">
            <div className="success-icon">
              <CheckCircle2 size={32} />
            </div>
            
            <div className="success-content">
              <h3>Reset Email Sent!</h3>
              <p>
                We've sent password reset instructions to your email address.
              </p>
              
              <div className="next-steps">
                <h4><Mail size={18} /> What to do next:</h4>
                <ol>
                  <li><strong>Check your email inbox</strong> for a message from DEETECH COMPUTERS</li>
                  <li><strong>Click the "Reset Password" link</strong> in the email</li>
                  <li>You'll be redirected to create a new password</li>
                  <li>Enter your new password and confirm it</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              <div className="email-tips">
                <div className="email-tips-header">
                  <AlertCircle size={20} />
                  <h5>Don't see the email?</h5>
                </div>
                <div className="email-tips-content">
                  <ul>
                    <li><strong>Check spam/junk folder</strong> - Sometimes emails get filtered</li>
                    <li><strong>Verify the email address</strong> - Make sure you entered the correct email</li>
                    <li><strong>Wait a few minutes</strong> - Emails can be delayed by 1-5 minutes</li>
                    <li><strong>Try again</strong> - You can request a new reset link</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              onClick={handleResendEmail}
              className="btn btn-secondary btn-block"
              disabled={loading.passwordReset}
            >
              {loading.passwordReset ? (
                <>
                  <span className="spinner"></span>
                  Resending Email...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Resend Reset Email
                </>
              )}
            </button>
            
            <button
              onClick={handleTryDifferentEmail}
              className="btn btn-outline btn-block"
            >
              <Mail size={16} />
              Try Different Email
            </button>
            
            <Link to="/login" className="btn btn-outline btn-block">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

          <div className="security-info">
            <div className="security-info-header">
              <Shield size={20} />
              <h5>Security & Timing Information</h5>
            </div>
            <div className="security-info-content">
              <div className="security-item">
                <Clock size={16} />
                <div>
                  <h6>Link Expiration</h6>
                  <p>The reset link expires in <strong>1 hour</strong> for security</p>
                </div>
              </div>
              <div className="security-item">
                <Key size={16} />
                <div>
                  <h6>One-Time Use</h6>
                  <p>Each reset link can only be used <strong>once</strong></p>
                </div>
              </div>
              <div className="security-item">
                <AlertCircle size={16} />
                <div>
                  <h6>Email Privacy</h6>
                  <p>For security, we don't reveal whether an email is registered</p>
                </div>
              </div>
            </div>
          </div>

          <div className="help-section">
            <p>
              Still having trouble? Contact support at{' '}
              <a href="mailto:support@deetechcomputers.com">support@deetechcomputers.com</a>
            </p>
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
            <Key size={32} />
          </div>
          <h1>Reset Your Password</h1>
          <p className="forgot-auth-subtitle">
            Enter your email address and we'll send you reset instructions
          </p>
        </div>

        <div className="reset-method-info">
          <div className="method-card">
            <div className="method-icon">
              <Mail size={24} />
            </div>
            <div className="method-content">
              <h4>Email Password Reset</h4>
              <p>Secure and instant - receive a reset link in your inbox</p>
              <small>We'll email you a secure link to create a new password</small>
            </div>
          </div>
        </div>

        <div className="forgot-auth-form-wrapper">
          {error && (
            <div className="error-message-box">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="reset-email">
              <Mail size={16} /> Your Account Email *
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.toLowerCase());
                setError('');
              }}
              placeholder="Enter your registered email address"
              required
              autoFocus
              autoComplete="email"
              disabled={loading.passwordReset}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              className={error ? 'error' : ''}
            />
            <p className="form-hint">
              Enter the email you used to create your DEETECH COMPUTERS account
            </p>
          </div>

          <button 
            onClick={handleSubmit}
            className="btn btn-primary btn-block"
            disabled={loading.passwordReset || !email.trim()}
          >
            {loading.passwordReset ? (
              <>
                <span className="spinner"></span>
                Sending Reset Email...
              </>
            ) : (
              <>
                <Mail size={18} />
                Send Reset Email
              </>
            )}
          </button>
          
          {attempts > 0 && (
            <div className="attempts-info">
              <AlertCircle size={14} />
              <span>Reset requested {attempts} time{attempts !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="forgot-back-link">
          <Link to="/login" className="forgot-back-link-text">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
          <span className="forgot-back-hint">
            Remember your password? Sign in instead
          </span>
        </div>

        <div className="security-info">
          <div className="security-info-header">
            <Shield size={20} />
            <h4>How It Works</h4>
          </div>
          <div className="security-features">
            <div className="feature">
              <div className="feature-icon">
                <div className="feature-number">1</div>
                <CheckCircle2 size={20} />
              </div>
              <div className="feature-content">
                <h5>Request Reset</h5>
                <p>Enter your email and request a reset link</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <div className="feature-number">2</div>
                <Mail size={20} />
              </div>
              <div className="feature-content">
                <h5>Check Email</h5>
                <p>We'll send you a secure reset link</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <div className="feature-number">3</div>
                <Key size={20} />
              </div>
              <div className="feature-content">
                <h5>Create Password</h5>
                <p>Click the link and set your new password</p>
              </div>
            </div>
          </div>
        </div>

        <div className="important-note">
          <div className="important-note-header">
            <AlertCircle size={20} />
            <h5>Important Information</h5>
          </div>
          <div className="important-note-content">
            <ul>
              <li>
                <Clock size={16} />
                <span>The reset link <strong>expires in 1 hour</strong> for security</span>
              </li>
              <li>
                <Key size={16} />
                <span>You can only use the link <strong>once</strong></span>
              </li>
              <li>
                <Mail size={16} />
                <span>Check your <strong>spam folder</strong> if you don't see the email</span>
              </li>
              <li>
                <AlertCircle size={16} />
                <span>Make sure to use the email you <strong>registered with</strong></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="support-info">
          <p>
            Need help? Contact{' '}
            <a href="mailto:deetechcomputers01@gmail.com">deetechcomputers01@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;