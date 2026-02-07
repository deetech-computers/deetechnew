import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

const ADMIN_EMAILS = new Set([
  'cartadaniel01@gmail.com'
]);

// Toast Notification Component
const ToastNotification = ({ message, type = 'success', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
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
    <div className={`auth-toast-notification ${type} ${isExiting ? 'auth-toast-exiting' : ''}`}>
      <div className="auth-toast-content">
        <div className="auth-toast-icon">
          {getToastIcon()}
        </div>
        <span className="auth-toast-message">{message}</span>
        <button onClick={handleClose} className="auth-toast-close" aria-label="Close notification">
          ×
        </button>
      </div>
      <div className="auth-toast-progress"></div>
    </div>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// Helper Functions
const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatError = (error) => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  
  if (error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Invalid email or password';
    if (msg.includes('email not confirmed')) return 'Please verify your email first';
    if (msg.includes('already registered') || msg.includes('email already in use')) 
      return 'An account with this email already exists';
    if (msg.includes('rate limit') || msg.includes('too many requests')) 
      return 'Too many attempts. Please wait a moment';
    if (msg.includes('password')) return 'Password must be at least 6 characters';
    if (msg.includes('user not found')) return 'No account found. Please sign up';
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('internet'))
      return 'Network error. Please check your connection';
    if (msg.includes('jwt')) return 'Session expired. Please sign in again';
    if (msg.includes('reset password') || msg.includes('recovery')) 
      return 'Reset link invalid or expired. Please request a new one.';
    return 'An error occurred. Please try again';
  }
  
  return 'An error occurred. Please try again';
};

// Auth Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState({
    auth: true,
    signup: false,
    signin: false,
    google: false,
    github: false,
    signout: false,
    passwordReset: false,
    updatePassword: false
  });
  
  const [toasts, setToasts] = useState([]);
  const mountedRef = useRef(true);
  const toastIdCounter = useRef(0);
  const authStateChangeRef = useRef(null);
  const refreshLockRef = useRef({ inFlight: false, cooldownUntil: 0, lastAttempt: 0 });
  const lastUserRef = useRef({ id: null, email: null });

  const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
  const REFRESH_CHECK_INTERVAL_MS = 2 * 60 * 1000;
  const REFRESH_COOLDOWN_MS = 2 * 60 * 1000;

  const ensureUserProfile = useCallback(async (authUser) => {
    if (!authUser?.id) return;
    const syncKey = `deetech-profile-sync-${authUser.id}`;
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(syncKey)) {
        return;
      }
    } catch {
      // ignore localStorage issues
    }

    try {
      const firstName = authUser.user_metadata?.first_name || authUser.user_metadata?.firstName || '';
      const lastName = authUser.user_metadata?.last_name || authUser.user_metadata?.lastName || '';

      // Check if profile already exists to avoid repeated upserts
      const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (selectError) {
        // If blocked by RLS, avoid spamming on every page
        if (selectError.code === '42501' || selectError.status === 403) {
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(syncKey, 'blocked');
            }
          } catch {
            // ignore localStorage issues
          }
        }
        console.warn('🔐 Profile select failed:', selectError);
        return;
      }

      if (existing?.id) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(syncKey, 'exists');
          }
        } catch {
          // ignore localStorage issues
        }
        return;
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          first_name: firstName,
          last_name: lastName,
          phone: authUser.user_metadata?.phone || null,
          address: authUser.user_metadata?.address || null,
          region: authUser.user_metadata?.region || null,
          city: authUser.user_metadata?.city || null,
          role: authUser.user_metadata?.role || 'user',
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (!upsertError) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(syncKey, 'ok');
          }
        } catch {
          // ignore localStorage issues
        }
      } else if (upsertError.code === '42501' || upsertError.status === 403) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(syncKey, 'blocked');
          }
        } catch {
          // ignore localStorage issues
        }
        console.warn('🔐 Profile upsert blocked by RLS.');
      }
    } catch (error) {
      console.warn('🔐 Profile sync failed:', error);
    }
  }, []);

  // Toast helper functions
  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${++toastIdCounter.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4300);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const refreshSessionIfNeeded = useCallback(async (reason = 'interval') => {
    if (!mountedRef.current) return;

    const now = Date.now();
    const lock = refreshLockRef.current;

    if (lock.inFlight) return;
    if (now < lock.cooldownUntil) return;
    if (now - lock.lastAttempt < 15000) return;

    lock.lastAttempt = now;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.expires_at) return;

      const expiresAtMs = session.expires_at * 1000;
      if (expiresAtMs - now > REFRESH_THRESHOLD_MS) return;

      lock.inFlight = true;
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (error.status === 429 || msg.includes('too many requests') || msg.includes('rate limit')) {
          lock.cooldownUntil = now + REFRESH_COOLDOWN_MS;
          console.warn('🔐 Refresh rate-limited. Cooling down.');
        } else {
          console.warn('🔐 Refresh error:', error);
        }
      }
    } catch (error) {
      console.warn('🔐 Refresh exception:', error);
    } finally {
      lock.inFlight = false;
    }
  }, []);

  // Initialization - FIXED: Simplified and optimized
  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        // Get initial session without triggering refresh storms
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          console.log('🔐 Initial session found for:', session.user.email);
          setUser(session.user);
          setIsGuest(false);
          ensureUserProfile(session.user);
        }
      } catch (error) {
        console.error('🔐 Initial session check error:', error);
      } finally {
        if (mountedRef.current) {
          setAuthInitialized(true);
          setLoading(prev => ({ ...prev, auth: false }));
        }
      }
    };

    initializeAuth();

    // Single auth state change listener - CRITICAL FIX
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        console.log('🔐 Auth state changed:', event);
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (session?.user && mountedRef.current) {
              const sameUser =
                lastUserRef.current.id === session.user.id &&
                lastUserRef.current.email === session.user.email;

              if (!sameUser) {
                console.log('🔐 Setting user:', session.user.email);
                setUser(session.user);
                lastUserRef.current = {
                  id: session.user.id,
                  email: session.user.email
                };
                ensureUserProfile(session.user);
              } else if (event !== 'TOKEN_REFRESHED') {
                // For non-refresh events, still ensure state is correct
                setUser(session.user);
              }

              setIsGuest(false);
              refreshLockRef.current.cooldownUntil = 0;
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('🔐 User signed out');
            if (mountedRef.current) {
              setUser(null);
              setIsGuest(false);
              lastUserRef.current = { id: null, email: null };
            }
            break;
            
          case 'PASSWORD_RECOVERY':
            console.log('🔐 Password recovery event');
            if (session?.user && mountedRef.current) {
              setUser(session.user);
              setIsGuest(false);
            }
            break;
            
          case 'USER_DELETED':
            console.log('🔐 User deleted');
            if (mountedRef.current) {
              setUser(null);
              setIsGuest(false);
              lastUserRef.current = { id: null, email: null };
            }
            break;
            
          default:
            console.log('🔐 Unhandled auth event:', event);
        }
      }
    );

    authStateChangeRef.current = subscription;

    return () => {
      mountedRef.current = false;
      if (authStateChangeRef.current) {
        authStateChangeRef.current.unsubscribe();
      }
    };
  }, []);

  // Manual, throttled refresh loop (autoRefreshToken is disabled)
  useEffect(() => {
    if (!authInitialized) return;

    const interval = setInterval(() => {
      refreshSessionIfNeeded('interval');
    }, REFRESH_CHECK_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSessionIfNeeded('visibility');
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleVisibility);
    };
  }, [authInitialized, refreshSessionIfNeeded]);

  // Sign Up - FIXED: Added proper error handling and no automatic sign-in
  const signUp = useCallback(async (email, password, userData = {}) => {
    setLoading(prev => ({ ...prev, signup: true }));
    try {
      const normalizedEmail = normalizeEmail(email);
      
      if (!normalizedEmail || !password) {
        showToast('Email and password are required', 'error');
        return { success: false };
      }
      
      if (!validateEmail(normalizedEmail)) {
        showToast('Please enter a valid email address', 'error');
        return { success: false };
      }
      
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return { success: false };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { 
          data: { 
            email_verified: true,
            first_name: userData.firstName?.trim() || '',
            last_name: userData.lastName?.trim() || '',
            phone: userData.phone || '',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        showToast(formatError(error), 'error');
        return { success: false };
      }
      
      // CRITICAL: Don't automatically sign in after sign up
      // Let the user confirm their email first
      showToast('Account created successfully! Please check your email to confirm your account.', 'success');
      return { 
        success: true, 
        email: normalizedEmail, 
        user: data.user,
        needsEmailConfirmation: !data.session
      };
    } catch (error) {
      console.error('🔐 Sign up error:', error);
      showToast('Unable to create account. Please try again', 'error');
      return { success: false };
    } finally {
      setLoading(prev => ({ ...prev, signup: false }));
    }
  }, [showToast]);

  // Sign In - FIXED: Added rate limiting protection
  const signIn = useCallback(async (email, password) => {
    setLoading(prev => ({ ...prev, signin: true }));
    try {
      const normalizedEmail = normalizeEmail(email);
      
      if (!normalizedEmail || !password) {
        showToast('Email and password are required', 'error');
        return { success: false };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        console.error('🔐 Sign in error:', error);
        
        // Handle specific error cases
        if (error.message.toLowerCase().includes('email not confirmed')) {
          showToast('Please verify your email before signing in', 'warning');
          return { success: false, needsVerification: true };
        }
        
        if (error.message.toLowerCase().includes('user not found')) {
          showToast('No account found. Please sign up', 'info');
          return { success: false, shouldSignUp: true };
        }
        
        showToast(formatError(error), 'error');
        return { success: false };
      }

      console.log('🔐 Signed in successfully:', data.user.email);
      showToast('Signed in successfully!', 'success');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('🔐 Sign in exception:', error);
      showToast('Unable to sign in. Please try again', 'error');
      return { success: false };
    } finally {
      setLoading(prev => ({ ...prev, signin: false }));
    }
  }, [showToast]);

  // Sign Out - FIXED: Simplified and safer
  const signOut = useCallback(async () => {
    setLoading(prev => ({ ...prev, signout: true }));
    try {
      console.log('🔐 Signing out user:', user?.email);
      
      // Clear any cached user data
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🔐 Sign out error:', error);
        // Still clear local state even if Supabase fails
      }

      // Always clear local state
      setUser(null);
      setIsGuest(false);

      showToast('Signed out successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('🔐 Sign out exception:', error);
      // Clear state even on error
      setUser(null);
      setIsGuest(false);
      showToast('Signed out', 'info');
      return { success: true };
    } finally {
      setLoading(prev => ({ ...prev, signout: false }));
    }
  }, [user?.email, showToast]);

  // Send Password Reset Email - FIXED: Simplified URL
  const sendPasswordResetEmail = useCallback(async (email) => {
    setLoading(prev => ({ ...prev, passwordReset: true }));
    try {
      const normalizedEmail = normalizeEmail(email);
      
      if (!normalizedEmail) {
        showToast('Email is required', 'error');
        return { success: false };
      }
      
      if (!validateEmail(normalizedEmail)) {
        showToast('Please enter a valid email address', 'error');
        return { success: false };
      }
      
      console.log('🔐 Sending password reset email to:', normalizedEmail);
      
      // Use a simpler redirect URL
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('🔐 Password reset error:', error);
        showToast(formatError(error), 'error');
        return { success: false };
      }

      console.log('✅ Password reset email sent successfully');
      showToast('Password reset email sent! Check your inbox.', 'success');
      return { success: true, email: normalizedEmail };
    } catch (error) {
      console.error('🔐 Password reset exception:', error);
      showToast('Unable to send reset email. Please try again.', 'error');
      return { success: false };
    } finally {
      setLoading(prev => ({ ...prev, passwordReset: false }));
    }
  }, [showToast]);

  // Update Password - FIXED: Added confirmation sign-in
  const updatePassword = useCallback(async (newPassword) => {
    setLoading(prev => ({ ...prev, updatePassword: true }));
    try {
      if (!newPassword || newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return { success: false };
      }

      console.log('🔐 Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('🔐 Update password error:', error);
        showToast(formatError(error), 'error');
        return { success: false };
      }

      console.log('✅ Password updated successfully');
      
      // Optional: Force a new sign-in with the new password to establish fresh session
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('🔐 Could not refresh session:', refreshError);
      }
      
      showToast('Password updated successfully!', 'success');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('🔐 Update password exception:', error);
      showToast('Unable to update password. Please try again.', 'error');
      return { success: false };
    } finally {
      setLoading(prev => ({ ...prev, updatePassword: false }));
    }
  }, [showToast]);

  // Verify Reset Token - FIXED: Simpler approach
  const verifyResetToken = useCallback(async () => {
    try {
      console.log('🔐 Verifying reset token...');
      
      // Let Supabase handle the token verification automatically
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ User authenticated via token:', session.user.email);
        return { 
          success: true, 
          valid: true, 
          user: session.user 
        };
      }
      
      // Check if we're in a recovery flow by examining URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const type = hashParams.get('type') || queryParams.get('type');
      
      if (type === 'recovery') {
        console.log('⚠️ Recovery token found but no session established');
        return { 
          success: false, 
          valid: false,
          error: 'Reset link may have expired. Please request a new one.',
          requiresNewLink: true
        };
      }
      
      console.log('❌ No valid recovery token found');
      return { 
        success: false, 
        valid: false,
        error: 'No recovery token found'
      };
    } catch (error) {
      console.error('🔐 Token verification exception:', error);
      return { 
        success: false, 
        valid: false,
        error: error.message
      };
    }
  }, []);

  // OAuth - FIXED: Added error recovery
  const signInWithGoogle = useCallback(async () => {
    setLoading(prev => ({ ...prev, google: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('🔐 Google sign in error:', error);
        showToast('Unable to sign in with Google', 'error');
        return { success: false };
      }
      
      // Success - user will be redirected
      return { success: true };
    } catch (error) {
      console.error('🔐 Google sign in exception:', error);
      showToast('Unable to sign in with Google', 'error');
      return { success: false };
    } finally {
      setLoading(prev => ({ ...prev, google: false }));
    }
  }, [showToast]);

  const signInWithGitHub = useCallback(async () => {
    setLoading(prev => ({ ...prev, github: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('🔐 GitHub sign in error:', error);
        showToast('Unable to sign in with GitHub', 'error');
        return { success: false };
      }
      
      // Success - user will be redirected
      return { success: true };
    } catch (error) {
      console.error('🔐 GitHub sign in exception:', error);
      showToast('Unable to sign in with GitHub', 'error');
      return { success: false };
    } finally {
      setLoading(prev => ({ ...prev, github: false }));
    }
  }, [showToast]);

  // Guest Mode
  const signInAsGuest = useCallback(() => {
    setUser(null);
    setIsGuest(true);
    showToast('Browsing as guest', 'info');
    return { success: true };
  }, [showToast]);

  // Get current session - AVOID USING THIS IN COMPONENTS
  const getSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { success: true, session: data.session };
    } catch (error) {
      console.error('🔐 Get session error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Check if user has recovery token in URL
  const hasRecoveryToken = useCallback(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || queryParams.get('type');
    return type === 'recovery';
  }, []);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    if (!user) return false;
    // Check user metadata or a separate admins table
    return (
      ADMIN_EMAILS.has(user.email?.toLowerCase()) ||
      user.user_metadata?.role === 'admin' ||
      user.user_metadata?.is_admin === true
    );
  }, [user]);

  // Verification helpers (no verification required for this project)
  const isVerified = useCallback(() => true, []);
  const needsVerification = false;

  // Refresh session (use sparingly)
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔐 Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('🔐 Session refresh error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, session: data.session };
    } catch (error) {
      console.error('🔐 Session refresh exception:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get user metadata
  const getUserMetadata = useCallback(() => {
    if (!user) return null;
    return user.user_metadata || {};
  }, [user]);

  // Clear auth state (for debugging/development)
  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsGuest(false);
    localStorage.clear();
    sessionStorage.clear();
    console.log('🔐 Auth state cleared');
  }, []);

  const contextValue = {
    // State
    user,
    authInitialized,
    isGuest,
    loading,
    toasts,
    
    // Actions
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    verifyResetToken,
    signInWithGoogle,
    signInWithGitHub,
    signInAsGuest,
    getSession,
    hasRecoveryToken,
    isAdmin,
    isVerified,
    needsVerification,
    refreshSession,
    getUserMetadata,
    clearAuthState,
    
    // Toast functions
    showToast,
    removeToast,
    clearAllToasts
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <div className="auth-toast-container">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
