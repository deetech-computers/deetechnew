import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Mail, Shield, CheckCircle, AlertCircle, RefreshCw, ArrowRight, LogOut } from 'lucide-react';
import '../styles/verification.css';

const VerificationPage = () => {
  const { 
    user, 
    needsVerification, 
    verificationEmail,
    resendConfirmationEmail,
    signOut,
    clearVerificationState
  } = useAuth();
  
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect if already verified or no verification needed
  useEffect(() => {
    if (!needsVerification && user?.email_confirmed_at) {
      navigate('/');
    }
  }, [needsVerification, user, navigate]);

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) return;
    
    setIsResending(true);
    try {
      const result = await resendConfirmationEmail(verificationEmail || user?.email);
      if (result.success) {
        showToast('Verification email sent!', 'success');
        setCountdown(60); // 60 second cooldown
      } else {
        showToast(result.error || 'Failed to send email', 'error');
      }
    } catch (error) {
      showToast('Failed to send verification email', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      clearVerificationState();
      navigate('/login');
    } catch (error) {
      showToast('Failed to sign out', 'error');
      setIsLoggingOut(false);
    }
  };

  const handleContinueAsGuest = () => {
    clearVerificationState();
    navigate('/');
  };

  const email = verificationEmail || user?.email || '';

  return (
    <div className="verification-page">
      <div className="verification-container">
        <div className="verification-header">
          <div className="verification-icon">
            <Mail size={48} className="icon-mail" />
            <Shield size={24} className="icon-shield" />
          </div>
          <h1>Verify Your Email</h1>
          <p className="verification-subtitle">
            We've sent a verification link to:
          </p>
          <div className="verification-email">
            <strong>{email}</strong>
          </div>
        </div>

        <div className="verification-steps">
          <div className="verification-step">
            <div className="step-number active">1</div>
            <div className="step-content">
              <h3>Check Your Inbox</h3>
              <p>Open the email we sent to {email} and click the verification link.</p>
            </div>
          </div>

          <div className="verification-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Click Verify</h3>
              <p>The link will automatically confirm your email address.</p>
            </div>
          </div>

          <div className="verification-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Start Shopping</h3>
              <p>Once verified, you'll have full access to your account.</p>
            </div>
          </div>
        </div>

        <div className="verification-actions">
          <button
            onClick={handleResendEmail}
            className="btn btn-primary btn-block"
            disabled={isResending || countdown > 0}
          >
            {isResending ? (
              <>
                <RefreshCw size={16} className="spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              <>
                <RefreshCw size={16} />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={() => window.open('https://mail.google.com', '_blank')}
            className="btn btn-outline btn-block"
          >
            Open Gmail
          </button>

          <button
            onClick={() => window.open('https://outlook.live.com', '_blank')}
            className="btn btn-outline btn-block"
          >
            Open Outlook
          </button>
        </div>

        <div className="verification-alert">
          <AlertCircle size={20} />
          <div>
            <strong>Didn't receive the email?</strong>
            <ul>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes - emails can take up to 5 minutes</li>
            </ul>
          </div>
        </div>

        <div className="verification-divider">
          <span>Or</span>
        </div>

        <div className="verification-alternatives">
          <button
            onClick={handleContinueAsGuest}
            className="btn btn-ghost btn-block"
          >
            <ArrowRight size={16} />
            Continue Shopping as Guest
          </button>

          <button
            onClick={handleSignOut}
            className="btn btn-text btn-block"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <RefreshCw size={16} className="spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut size={16} />
                Sign Out and Try Different Email
              </>
            )}
          </button>
        </div>

        <div className="verification-footer">
          <p>
            By verifying your email, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </p>
          <p className="verification-support">
            Need help? <a href="/support">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;