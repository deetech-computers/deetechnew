// components/OTPVerification.js
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase'; // <-- ADD THIS IMPORT
import { Key, RefreshCw, CheckCircle } from 'lucide-react';

const OTPVerification = ({ email, onVerified, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(30); // Resend countdown
  const inputRefs = useRef([]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Auto-focus previous on backspace
    if (!value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePaste();
    }
  };

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      const pastedDigits = pastedText.replace(/\D/g, '').slice(0, 6).split('');
      
      if (pastedDigits.length === 6) {
        const newOtp = [...otp];
        pastedDigits.forEach((digit, index) => {
          newOtp[index] = digit;
        });
        setOtp(newOtp);
        inputRefs.current[5]?.focus(); // Focus last input
      }
    } catch (error) {
      console.log('Clipboard access denied');
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setMessage('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        if (error.message.includes('Invalid OTP')) {
          setMessage('❌ Invalid or expired code. Please try again.');
        } else if (error.message.includes('rate limit')) {
          setMessage('⏳ Too many attempts. Please wait a minute.');
        } else {
          setMessage('❌ Verification failed. Please try again.');
        }
        throw error;
      }
      
      setMessage('✅ Email verified successfully!');
      
      // Small delay before calling onVerified for better UX
      setTimeout(() => {
        onVerified(data);
      }, 1000);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setMessage('');
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    
    try {
      await onResend();
      setCountdown(30); // Reset countdown
      setMessage('📧 New code sent! Check your email.');
    } catch (error) {
      setMessage('❌ Failed to send new code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification">
      <div className="otp-header">
        <Key size={48} color="#3b82f6" />
        <h2>Verify Your Email</h2>
        <p>Enter the 6-digit code sent to:</p>
        <p className="otp-email"><strong>{email}</strong></p>
        <p className="otp-note">The code will expire in 10 minutes</p>
      </div>
      
      <div className="otp-inputs">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="otp-input"
            disabled={loading}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      
      <button 
        onClick={handleVerify}
        disabled={loading || otp.join('').length !== 6}
        className="btn btn-primary otp-verify-btn"
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Verifying...
          </>
        ) : 'Verify Code'}
      </button>
      
      <div className="otp-actions">
        <p>Didn't receive the code?</p>
        <button 
          onClick={handleResendClick}
          disabled={loading || countdown > 0}
          className="btn-link otp-resend-btn"
        >
          <RefreshCw size={14} />
          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
        </button>
        <button 
          onClick={handlePaste}
          className="btn-link otp-paste-btn"
        >
          📋 Paste Code
        </button>
      </div>
      
      {message && (
        <div className={`otp-message ${message.includes('✅') ? 'success' : 
          message.includes('❌') ? 'error' : 'info'}`}>
          {message.includes('✅') ? <CheckCircle size={16} /> : null}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;