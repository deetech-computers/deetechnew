// components/VerificationCodeInput.jsx
import React, { useState } from 'react';
import { Shield, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const VerificationCodeInput = ({ email, onVerify, onResend, loading, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Simple countdown
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter exactly 6 digits');
      return;
    }
    
    setError('');
    try {
      await onVerify(code);
    } catch (err) {
      setError(err.message || 'Invalid code');
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    setCanResend(false);
    setCountdown(30);
    setCode('');
    await onResend();
  };

  return (
    <div className="verification-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Shield size={48} style={{ color: '#3b82f6', marginBottom: '15px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>
          Verify Your Email
        </h2>
        <p style={{ color: '#666', marginBottom: '5px' }}>
          Enter the 6-digit code sent to:
        </p>
        <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '20px' }}>
          {email}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              // Only allow numbers, max 6 digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
              setError('');
            }}
            placeholder="Enter 6-digit code"
            style={{
              width: '100%',
              padding: '12px 15px',
              fontSize: '18px',
              border: `2px solid ${error ? '#ef4444' : '#ddd'}`,
              borderRadius: '8px',
              textAlign: 'center',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            disabled={loading}
            autoFocus
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '5px' }}>
              <AlertCircle size={14} style={{ marginRight: '5px' }} />
              {error}
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            Enter the 6-digit code from your email
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: code.length === 6 && !loading ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: code.length === 6 && !loading ? 'pointer' : 'not-allowed',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="spin" />
              Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          Didn't receive the code?
        </p>
        <button
          onClick={handleResend}
          disabled={!canResend || loading}
          style={{
            background: 'none',
            border: 'none',
            color: canResend && !loading ? '#3b82f6' : '#9ca3af',
            cursor: canResend && !loading ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            textDecoration: 'underline'
          }}
        >
          {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
        </button>
      </div>

      <button
        onClick={onBack}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: '8px',
          color: '#666',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>
    </div>
  );
};

export default VerificationCodeInput;