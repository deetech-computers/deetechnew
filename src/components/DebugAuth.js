// src/components/DebugAuth.js
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const { 
    authInitialized, 
    loading, 
    user, 
    pendingVerificationEmail 
  } = useAuth();

  useEffect(() => {
    console.log('🔍 Auth Debug Info:', {
      authInitialized,
      loadingAuth: loading.auth,
      loadingSignin: loading.signin,
      loadingSignup: loading.signup,
      user: user?.email || 'No user',
      pendingVerificationEmail,
      timestamp: new Date().toISOString()
    });
  }, [authInitialized, loading, user, pendingVerificationEmail]);

  return null; // This component doesn't render anything
};

export default DebugAuth;

// Add it to your App.js:
// <DebugAuth />