import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Mail, RefreshCw, CheckCircle, X, AlertCircle, ExternalLink, Clock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/email-verification.css';


const EmailVerificationPrompt = ({ email, onClose, isModal = true }) => {
  const [resent, setResent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const { 
    resendVerificationEmail, 
    signInWithVerificationCode,
    verificationTimeLeft,
    formatTimeLeft 
  } = useAuth();

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setCodeError('');
    try {
      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        setResent(true);
        setTimeout(() => setResent(false), 3000);
      } else {
        setCodeError(result.error?.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setCodeError('Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  }, [email, resendVerificationEmail]);
  
  const handleVerifyWithCode = useCallback(async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setCodeError('');

    try {
      const result = await signInWithVerificationCode(email, verificationCode);
      
      if (result.success) {
        // Success - code verified
        if (onClose) onClose();
      } else {
        setCodeError(result.error?.message || 'Invalid verification code');
      }
    } catch (error) {
      setCodeError(error.message || 'Failed to verify code');
    } finally {
      setVerifying(false);
    }
  }, [email, verificationCode, signInWithVerificationCode, onClose]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setVerificationCode(value);
      setCodeError('');
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const content = (
    <>
      <div className="verification-header">
        <div className="verification-icon">
          <Shield size={24} />
        </div>
        <div className="header-content">
          <h3>Verify Your Email Address</h3>
          {verificationTimeLeft > 0 && (
            <div className="timer">
              <Clock size={14} />
              <span>Code expires in: {formatTime(verificationTimeLeft)}</span>
            </div>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="close-btn"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="verification-body">
        <div className="email-display">
          <span className="email-label">Verification sent to:</span>
          <strong className="email-value">{email}</strong>
        </div>
        
        <div className="verification-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Check your inbox</h4>
              <p>Look for an email from DEETECH COMPUTERS with a 6-digit code</p>
              <small className="tip">Don't forget to check spam or junk folder</small>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Enter the 6-digit code</h4>
              <p>The code will expire in 10 minutes</p>
              <small className="tip">Code format: 123456</small>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Click verify</h4>
              <p>Your email will be verified immediately</p>
            </div>
          </div>
        </div>
        
        <div className="code-input-section">
          <div className="code-input-group">
            <label htmlFor="verificationCode">6-Digit Verification Code</label>
            <div className="code-input-wrapper">
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="123456"
                maxLength={6}
                className={`code-input ${codeError ? 'error' : ''}`}
              />
              <button
                onClick={handleVerifyWithCode}
                disabled={verifying || verificationCode.length !== 6}
                className="verify-code-btn"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            {codeError && <div className="code-error">{codeError}</div>}
          </div>
        </div>
        
        <div className="verification-tips">
          <AlertCircle size={16} />
          <p>
            <strong>Code not received?</strong> Check spam folder or wait a minute. 
            If still not received, try resending.
          </p>
        </div>
      </div>
      
      <div className="verification-footer">
        <button 
          onClick={handleResend}
          disabled={resendLoading || resent || verificationTimeLeft > 0}
          className={`resend-btn ${resent ? 'resent' : ''}`}
        >
          {resendLoading ? (
            <>
              <RefreshCw className="spin" size={16} />
              Sending...
            </>
          ) : resent ? (
            <>
              <CheckCircle size={16} />
              Code Resent!
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Resend Verification Code
            </>
          )}
        </button>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="later-btn"
          >
            I'll verify later
          </button>
        )}
        
        <div className="support-info">
          <p>
            Need help? Contact{' '}
            <a href="mailto:deetechcomputers01@gmail.com" className="support-link">
              deetechcomputers01@gmail.com
              <ExternalLink size={12} />
            </a>
          </p>
        </div>
      </div>
    </>
  );
  
  if (isModal) {
    return (
      <div className="email-verification-modal-overlay">
        <div className="email-verification-modal">
          {content}
        </div>
      </div>
    );
  }
  
  return (
    <div className="email-verification-inline">
      {content}
    </div>
  );
};

EmailVerificationPrompt.propTypes = {
  email: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  isModal: PropTypes.bool
};

export default EmailVerificationPrompt;