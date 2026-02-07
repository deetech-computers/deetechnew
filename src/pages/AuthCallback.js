import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { CheckCircle, XCircle, RefreshCw, Lock, ArrowRight, Home } from 'lucide-react';
import '../styles/auth-callback.css';

const AuthCallback = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Processing authentication...');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Processing URL...');
        
        // Check for errors in URL first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const errorMsg = hashParams.get('error_description') || queryParams.get('error_description');
        if (errorMsg) {
          console.error('🔐 URL error detected:', errorMsg);
          setStatus('error');
          setMessage(decodeURIComponent(errorMsg));
          setTimeout(() => navigate('/forgot-password'), 4000);
          return;
        }
        
        // Check for recovery token
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const type = hashParams.get('type') || queryParams.get('type');
        
        if (type === 'recovery' && accessToken) {
          console.log('🔐 Processing recovery token...');
          
          try {
            // Set session with recovery token
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: ''
            });
            
            if (error) {
              throw new Error('Reset link invalid or expired');
            }
            
            if (data?.user) {
              console.log('🔐 Recovery successful:', data.user.email);
              setUserEmail(data.user.email);
              setStatus('recovery');
              setMessage('Reset link verified! Redirecting...');
              
              // Clear URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              setTimeout(() => {
                navigate('/reset-password', { replace: true });
              }, 1500);
              return;
            }
          } catch (error) {
            console.error('🔐 Recovery error:', error);
            setStatus('error');
            setMessage(error.message || 'Reset link invalid. Please request a new one.');
            setTimeout(() => navigate('/forgot-password'), 4000);
            return;
          }
        }
        
        // Regular auth (Supabase auto-handles OAuth)
        console.log('🔐 Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('🔐 Authenticated:', session.user.email);
          setUserEmail(session.user.email);
          setStatus('success');
          setMessage('Authentication successful!');
          
          // Clear URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          console.log('🔐 No session found');
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        }
        
      } catch (error) {
        console.error('🔐 AuthCallback error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-container">
        <div className={`auth-callback-content ${status}`}>
          
          {status === 'verifying' && (
            <>
              <div className="callback-icon verifying">
                <RefreshCw size={64} className="spin" />
              </div>
              <h2>Verifying</h2>
              <p className="callback-message">{message}</p>
              <div className="callback-progress">
                <div className="progress-bar"></div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="callback-icon success">
                <CheckCircle size={64} />
              </div>
              <h2>Success!</h2>
              <p className="callback-message">{message}</p>
              {userEmail && (
                <div className="user-info">
                  <p>Welcome, <strong>{userEmail}</strong></p>
                </div>
              )}
              <div className="callback-actions">
                <button 
                  onClick={() => navigate('/', { replace: true })}
                  className="btn btn-primary"
                >
                  <Home size={18} />
                  Go to Dashboard
                </button>
              </div>
            </>
          )}

          {status === 'recovery' && (
            <>
              <div className="callback-icon recovery">
                <Lock size={64} />
              </div>
              <h2>Reset Link Verified</h2>
              <p className="callback-message">{message}</p>
              {userEmail && (
                <div className="user-info">
                  <p>Account: <strong>{userEmail}</strong></p>
                </div>
              )}
              <div className="callback-actions">
                <button 
                  onClick={() => navigate('/reset-password', { replace: true })}
                  className="btn btn-primary"
                >
                  <ArrowRight size={18} />
                  Continue
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="callback-icon error">
                <XCircle size={64} />
              </div>
              <h2>Error</h2>
              <p className="callback-message">{message}</p>
              <div className="callback-actions">
                <button 
                  onClick={() => navigate('/forgot-password')}
                  className="btn btn-primary"
                >
                  Request New Reset Link
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-outline"
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;