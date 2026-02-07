import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Phone, Shield, RefreshCw, ShoppingBag, Check, X, Zap, Package, Users, Gift } from 'lucide-react';
import Input from '../components/Input';
import '../styles/login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });
  
  // Toast state management
  const [toasts, setToasts] = useState([]);
  
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signInAsGuest,
    loading: authLoading,
    authInitialized
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  const submitTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Benefits of signing up
  const signupBenefits = [
    {
      icon: Zap,
      title: 'Faster Checkouts',
      description: 'Save your shipping and payment details for quick, one-click purchases'
    },
    {
      icon: Package,
      title: 'Order Tracking',
      description: 'Track your orders in real-time and receive delivery updates'
    },
    {
      icon: Users,
      title: 'Affiliate Dashboard',
      description: 'Earn commissions by referring friends and tracking your referrals'
    },
    {
      icon: Gift,
      title: 'Exclusive Offers',
      description: 'Get access to member-only discounts and early product launches'
    }
  ];

  // Toast helper functions
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4300);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: '' };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letters');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letters');
    
    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Numbers');
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Special characters');
    
    // Common weak passwords to avoid
    const weakPasswords = ['password', '123456', 'qwerty', 'letmein', 'welcome'];
    if (weakPasswords.includes(password.toLowerCase())) {
      score = Math.max(1, score - 2);
      feedback.push('Avoid common passwords');
    }
    
    // Get strength label
    let strengthLabel = '';
    if (score >= 4) strengthLabel = 'Strong';
    else if (score >= 3) strengthLabel = 'Good';
    else if (score >= 2) strengthLabel = 'Fair';
    else strengthLabel = 'Weak';
    
    return {
      score,
      feedback: feedback.length > 0 ? `Add: ${feedback.slice(0, 3).join(', ')}` : '',
      label: strengthLabel
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Update password strength when password changes (for signup)
  useEffect(() => {
    if (!isLogin && formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    }
  }, [formData.password, isLogin]);

  const validateForm = () => {
    const errors = {};
    
    const email = formData.email.trim();
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    } else if (email.length > 254) {
      errors.email = 'Email is too long';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 100) {
      errors.password = 'Password is too long';
    }
    
    if (!isLogin) {
      // Password confirmation check
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      // Password strength check (only for signup)
      if (passwordStrength.score < 2) {
        errors.password = 'Password is too weak. Please choose a stronger password.';
      }
      
      const firstName = formData.firstName?.trim();
      const lastName = formData.lastName?.trim();
      
      if (!firstName) errors.firstName = 'First name is required';
      else if (firstName.length > 50) errors.firstName = 'First name is too long';
      
      if (!lastName) errors.lastName = 'Last name is required';
      else if (lastName.length > 50) errors.lastName = 'Last name is too long';
      
      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      } else {
        const clean = formData.phone.replace(/\D/g, '');
        if (clean.length !== 10 || !clean.startsWith('0')) {
          errors.phone = 'Please enter a valid 10-digit Ghanaian phone number (e.g., 0241234567)';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let sanitizedValue = value;
    
    switch (name) {
      case 'email':
        sanitizedValue = value.toLowerCase().slice(0, 254);
        break;
      case 'password':
        sanitizedValue = value.slice(0, 100);
        // Update password strength in real-time
        if (!isLogin) {
          const strength = checkPasswordStrength(sanitizedValue);
          setPasswordStrength(strength);
        }
        break;
      case 'confirmPassword':
        sanitizedValue = value.slice(0, 100);
        break;
      case 'firstName':
      case 'lastName':
        sanitizedValue = value.replace(/[^a-zA-Z\s-]/g, '').slice(0, 50);
        break;
      case 'phone':
        sanitizedValue = value.replace(/[^\d]/g, '').slice(0, 10);
        break;
      default:
        sanitizedValue = value;
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      showToast('Please wait...', 'info');
      return;
    }
    
    if (!validateForm()) {
      showToast('Please check the form for errors', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();

      if (isLogin) {
        // SIGN IN
        const result = await signIn(normalizedEmail, formData.password);
        
        if (result.success) {
          // User signed in successfully - redirect to intended destination
          showToast('Welcome back!', 'success');
          navigate(from, { replace: true });
        } else {
          // If user not found, suggest signing up
          if (result.error?.includes('Please sign up')) {
            showToast('No account found. Please sign up.', 'info');
            setIsLogin(false); // Switch to sign up mode
          } else {
            showToast(result.error || 'Unable to sign in', 'error');
          }
        }
      } else {
        // SIGN UP (and auto-login)
        const phoneNumber = formData.phone.replace(/\D/g, '');
        const userData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: phoneNumber
        };
        
        const result = await signUp(normalizedEmail, formData.password, userData);
        
        if (result.success) {
          // User created and automatically logged in
          showToast('Account created successfully!', 'success');
          
          // Redirect to homepage or intended destination
          navigate(from, { replace: true });
          
          // Reset form
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phone: ''
          });
          setIsLogin(true); // Switch to login mode
          setPasswordStrength({ score: 0, feedback: '', label: '' });
        } else {
          showToast(result.error || 'Unable to create account', 'error');
        }
      }
    } catch (error) {
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      submitTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setIsSubmitting(false);
        }
      }, 1000);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setFormErrors({});
    setPasswordStrength({ score: 0, feedback: '', label: '' });
    
    setFormData(prev => ({ 
      email: prev.email,
      password: '', 
      confirmPassword: '',
      firstName: '', 
      lastName: '', 
      phone: '' 
    }));
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        showToast('Redirecting to Google...', 'info');
      } else {
        showToast(result.error || 'Unable to sign in with Google', 'error');
      }
    } catch (error) {
      showToast('Unable to sign in with Google', 'error');
    } finally {
      setTimeout(() => {
        if (mountedRef.current) {
          setIsSubmitting(false);
        }
      }, 1000);
    }
  };

  const handleGitHubSignIn = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await signInWithGitHub();
      if (result.success) {
        showToast('Redirecting to GitHub...', 'info');
      } else {
        showToast(result.error || 'Unable to sign in with GitHub', 'error');
      }
    } catch (error) {
      showToast('Unable to sign in with GitHub', 'error');
    } finally {
      setTimeout(() => {
        if (mountedRef.current) {
          setIsSubmitting(false);
        }
      }, 1000);
    }
  };

  const handleContinueAsGuest = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      signInAsGuest();
      showToast('Browsing as guest', 'info');
      navigate(from, { replace: true });
    } catch (error) {
      showToast('Unable to continue as guest', 'error');
      setIsSubmitting(false);
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = ({ strength }) => {
    if (!strength.label) return null;
    
    const strengthColors = {
      'Weak': '#ef4444',
      'Fair': '#f59e0b',
      'Good': '#10b981',
      'Strong': '#059669'
    };
    
    const strengthWidths = {
      'Weak': '25%',
      'Fair': '50%',
      'Good': '75%',
      'Strong': '100%'
    };
    
    return (
      <div className="password-strength-indicator">
        <div className="strength-bar">
          <div 
            className="strength-progress" 
            style={{ 
              width: strengthWidths[strength.label],
              backgroundColor: strengthColors[strength.label]
            }}
          />
        </div>
        <div className="strength-info">
          <span className="strength-label" style={{ color: strengthColors[strength.label] }}>
            {strength.label} password
          </span>
          {strength.feedback && (
            <span className="strength-feedback">{strength.feedback}</span>
          )}
        </div>
      </div>
    );
  };

  // Benefits component for signup
  const SignupBenefits = () => (
    <div className="login-signup-benefits">
      <h3 className="benefits-title">Why Create an Account?</h3>
      <div className="benefits-grid">
        {signupBenefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">
                <Icon size={24} />
              </div>
              <div className="benefit-content">
                <h4 className="benefit-title">{benefit.title}</h4>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!authInitialized) {
    return (
      <div className="login-auth-page">
        <div className="login-auth-container">
          <div className="login-auth-loading">
            <RefreshCw size={32} className="login-spin" />
            <p>Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = isSubmitting || authLoading.signin || authLoading.signup || authLoading.google || authLoading.github;

  return (
    <div className="login-auth-page">
      <div className="login-auth-container">
        <div className="login-auth-header">
          <div className="login-auth-logo">
            <Shield size={32} />
          </div>
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="login-auth-subtitle">
            {isLogin ? 'Sign in to your account' : 'Join us today and unlock exclusive benefits'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-auth-form" noValidate>
          {!isLogin && (
            <>
              <div className="login-form-row">
                <Input
                  type="text"
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  required
                  disabled={isLoading}
                  icon={User}
                  error={formErrors.firstName}
                  maxLength={50}
                />
                <Input
                  type="text"
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  required
                  disabled={isLoading}
                  icon={User}
                  error={formErrors.lastName}
                  maxLength={50}
                />
              </div>

              <Input
                type="tel"
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0241234567"
                required
                disabled={isLoading}
                icon={Phone}
                error={formErrors.phone}
                helpText="10-digit Ghanaian number"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={10}
              />
            </>
          )}

          <Input
            type="email"
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            required
            disabled={isLoading}
            icon={Mail}
            error={formErrors.email}
            autoComplete="email"
            maxLength={254}
            helpText="We'll never share your email with anyone else"
          />

          {/* Use Input component's built-in password toggle */}
          <Input
            type="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={isLogin ? 'Enter your password' : 'Create a password'}
            required
            disabled={isLoading}
            icon={Lock}
            error={formErrors.password}
            showPasswordToggle={true}
            helpText={isLogin ? '' : 'Minimum 6 characters'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            maxLength={100}
          />

          {!isLogin && (
            <>
              {formData.password && (
                <PasswordStrengthIndicator strength={passwordStrength} />
              )}
              
              {/* Use Input component's built-in password toggle for confirm password too */}
              <Input
                type="password"
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                required
                disabled={isLoading}
                icon={Lock}
                error={formErrors.confirmPassword}
                showPasswordToggle={true}
                helpText="Passwords must match"
                autoComplete="new-password"
                maxLength={100}
              />

              {formData.password && formData.confirmPassword && (
                <div className="password-match-indicator">
                  {formData.password === formData.confirmPassword ? (
                    <span className="match-success">
                      <Check size={14} /> Passwords match
                    </span>
                  ) : (
                    <span className="match-error">
                      <X size={14} /> Passwords don't match
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {isLogin && (
            <div className="login-forgot-password">
              <Link 
                to="/forgot-password" 
                onClick={(e) => isLoading && e.preventDefault()}
                className="login-forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn login-btn-primary login-btn-block" 
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="login-spin" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="login-auth-divider">
          <span>Or continue with</span>
        </div>

        <div className="login-social-buttons">
          <button 
            onClick={handleGoogleSignIn} 
            className="login-btn login-btn-google" 
            disabled={isLoading}
            type="button"
            aria-label="Sign in with Google"
          >
            {authLoading.google ? (
              <>
                <RefreshCw size={16} className="login-spin" />
                Connecting...
              </>
            ) : (
              <>
                <img 
                  src="/google-icon.svg" 
                  alt="Google" 
                  width="16" 
                  height="16" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'inline';
                    }
                  }}
                />
                <span className="login-google-fallback" style={{display: 'none'}}>G</span>
                Sign {isLogin ? 'in' : 'up'} with Google
              </>
            )}
          </button>

          {/* GitHub button would go here */}
        </div>

        <div className="login-auth-guest-button">
          <button 
            onClick={handleContinueAsGuest} 
            className="login-btn login-btn-outline"
            disabled={isLoading}
            type="button"
            aria-label="Continue as guest"
          >
            <ShoppingBag size={16} />
            Continue as Guest
          </button>
        </div>

        {/* Show benefits after Continue as Guest but before Terms Notice */}
        {!isLogin && <SignupBenefits />}

        <div className="login-auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              type="button" 
              className="login-link-button" 
              onClick={handleModeSwitch} 
              disabled={isLoading}
              aria-label={isLogin ? 'Switch to sign up' : 'Switch to sign in'}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {!isLogin && (
          <div className="login-terms-notice">
            <p>
              By creating an account, you agree to our{' '}
              <Link to="/terms-of-use" onClick={(e) => isLoading && e.preventDefault()}>Terms of Service</Link> and{' '}
              <Link to="/privacy-policy" onClick={(e) => isLoading && e.preventDefault()}>Privacy Policy</Link>.
            </p>
          </div>
        )}
      </div>

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Login;