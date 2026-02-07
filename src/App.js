import React, { Suspense, lazy, useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import Navbar from './components/Layout/Navbar';
import MobileBottomNav from './components/Layout/MobileBottomNav';
import Footer from './components/Layout/Footer';
import SplashScreen from './components/SplashScreen';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import VerificationBanner from './components/VerificationBanner';
import TestAuth from './components/TestAuth';
import './App.css';

// ========== Edge Swipe Navigation Component ==========
const EdgeSwipeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const swipeStartX = useRef(0);
  const swipeActiveRef = useRef(false);

  const shouldEnableSwipe = !location.pathname.startsWith('/thank-you');

  const handleTouchStart = useCallback((e) => {
    if (!shouldEnableSwipe) return;
    
    const touchX = e.touches[0].clientX;
    
    // Only trigger from left edge (within 30px from left)
    if (touchX <= 30) {
      swipeActiveRef.current = true;
      swipeStartX.current = touchX;
    }
  }, [shouldEnableSwipe]);

  const handleTouchMove = useCallback((e) => {
    if (!swipeActiveRef.current || !shouldEnableSwipe) return;
    
    // Prevent default only when we're actively swiping from edge
    if (swipeStartX.current <= 30) {
      e.preventDefault();
    }
  }, [shouldEnableSwipe]);

  const handleTouchEnd = useCallback((e) => {
    if (!swipeActiveRef.current || !shouldEnableSwipe) return;
    
    const touchX = e.changedTouches[0].clientX;
    const swipeDistance = touchX - swipeStartX.current;
    
    // If swiped right at least 60px from left edge, go back
    if (swipeDistance >= 60 && swipeStartX.current <= 30) {
      navigate(-1);
    }
    
    swipeActiveRef.current = false;
    swipeStartX.current = 0;
  }, [shouldEnableSwipe, navigate]);

  useEffect(() => {
    if (!shouldEnableSwipe) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, shouldEnableSwipe]);

  return null;
};

// ========== ScrollToTop Component ==========
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Scroll to top on initial load
    if (isInitialMount.current) {
      window.scrollTo(0, 0);
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => {
    // Smooth scroll to top on route change
    if (!isInitialMount.current) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  }, [pathname]);

  return null;
};

// ========== Verification Banner Wrapper ==========
const VerificationBannerWrapper = () => {
  const location = useLocation();
  
  // Hide banner on these pages
  const hideBannerPaths = [
    '/login',
    '/verify-email',
    '/verify-success',
    '/auth/callback',
    '/checkout',
    '/thank-you'
  ];

  const shouldHideBanner = hideBannerPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );

  if (shouldHideBanner) {
    return null;
  }

  return <VerificationBanner />;
};

// ========== Mobile Bottom Nav Wrapper ==========
const MobileNavWrapper = () => {
  const location = useLocation();
  
  const hideBottomNavPaths = [
    '/product/',
    '/checkout',
    '/admin',
    '/thank-you',
    '/verify-email',
    '/verify-success'
  ];

  const shouldHideBottomNav = hideBottomNavPaths.some(path => 
    location.pathname.startsWith(path)
  );

  if (shouldHideBottomNav) {
    return null;
  }

  return <MobileBottomNav />;
};

// ========== Footer Wrapper ==========
const FooterWrapper = () => {
  const location = useLocation();
  
  const hideFooterPaths = [
    '/cart',
    '/checkout',
    '/product/',
    '/admin',
    '/thank-you',
    '/verify-email',
    '/verify-success'
  ];

  const shouldHideFooter = hideFooterPaths.some(path => 
    location.pathname.startsWith(path)
  );

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
};

// ========== Lazy Load Pages ==========
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const Account = lazy(() => import('./pages/Account'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const Affiliates = lazy(() => import('./pages/Affiliates'));
const Warranty = lazy(() => import('./pages/Warranty'));
const PaymentPolicy = lazy(() => import('./pages/PaymentPolicy'));
const About = lazy(() => import('./pages/About'));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard'));
const DeliveryPolicy = lazy(() => import('./pages/DeliveryPolicy'));
const ReturnRefundPolicy = lazy(() => import('./pages/ReturnRefundPolicy'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const Support = lazy(() => import('./pages/Support'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const FAQ = lazy(() => import('./pages/FAQ'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
// ADDED: Verification pages
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const VerifySuccess = lazy(() => import('./pages/VerifySuccess'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
// ========== Preload Function ==========
const preloadRoute = (routeImport) => {
  if (typeof window !== 'undefined') {
    routeImport();
  }
};

// ========== Main App Component ==========
function App() {
  const appInitializedRef = useRef(false);

  useEffect(() => {
    if (appInitializedRef.current) return;
    appInitializedRef.current = true;

    // Initial scroll to top
    window.scrollTo(0, 0);
    
    // Clean up any stored scroll positions
    sessionStorage.removeItem('lastScrollPosition');
    localStorage.removeItem('scrollPosition');

    // Preload important routes after a short delay
    const preloadTimer = setTimeout(() => {
      preloadRoute(() => import('./pages/Products'));
      preloadRoute(() => import('./pages/Support'));
      preloadRoute(() => import('./pages/Cart'));
      preloadRoute(() => import('./pages/AuthCallback'));
      preloadRoute(() => import('./pages/VerificationPage'));
      preloadRoute(() => import('./pages/VerifySuccess'));
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, []);

  return (
    <AuthProvider>
      <DarkModeProvider>
        <ToastProvider>
          <Router>
            <SplashScreen>
              <div className="App">
                <ScrollToTop />
                <EdgeSwipeNavigation />
                
                <Navbar />
                <VerificationBannerWrapper />
                <main className="main-content">
                  <Suspense 
                    fallback={
                      <div className="global-loading">
                        <LoadingSpinner />
                        <p>Loading amazing content...</p>
                      </div>
                    }
                  >
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/thank-you" element={<ThankYou />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/test-auth" element={<TestAuth />} />
                      {/* Auth Routes */}
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/verify-email" element={<VerificationPage />} />
                      <Route path="/verify-success" element={<VerifySuccess />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                   
                     <Route path="/update-password" element={<UpdatePassword />} />
                      <Route path="/faq" element={<FAQ />} />
                      
                      {/* Policy & Info Pages */}
                      <Route path="/warranty" element={<Warranty />} />
                      <Route path="/payment-policy" element={<PaymentPolicy />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/delivery-policy" element={<DeliveryPolicy />} />
                      <Route path="/return-refund-policy" element={<ReturnRefundPolicy />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-use" element={<TermsOfUse />} />
                      <Route path="/support" element={<Support />} />
                      
                      {/* Affiliate Routes */}
                      <Route path="/affiliates" element={<Affiliates />} />
                      
                      {/* Protected Routes (Require Authentication) */}
                      <Route 
                        path="/account" 
                        element={
                          <ProtectedRoute requireVerification>
                            <Account />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="/affiliate-dashboard" 
                        element={
                          <ProtectedRoute requireVerification>
                            <AffiliateDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Protected Routes (Authentication Only, No Verification Required) */}
                      <Route 
                        path="/wishlist" 
                        element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Admin Routes (Require Admin & Verification) */}
                      <Route 
                        path="/admin/*" 
                        element={
                          <ProtectedRoute requireAdmin={true} requireVerification>
                            <Admin />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* 404 Fallback */}
                      <Route 
                        path="*" 
                        element={
                          <div className="not-found">
                            <h1>404 - Page Not Found</h1>
                            <p>The page you're looking for doesn't exist.</p>
                            <a href="/" className="btn">Go Home</a>
                          </div>
                        } 
                      />
                    </Routes>
                  </Suspense>
                </main>
                <FooterWrapper />
                <MobileNavWrapper />
              </div>
            </SplashScreen>
          </Router>
        </ToastProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}

// ========== Error Boundary ==========
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    window.scrollTo(0, 0);
  }

  handleReload = () => {
    sessionStorage.clear();
    localStorage.removeItem('lastScrollPosition');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <div className="error-content">
            <h1>Something went wrong</h1>
            <p>We're sorry, but something went wrong. Please try refreshing the page.</p>
            <div className="error-actions">
              <button 
                onClick={this.handleReload} 
                className="btn btn-primary"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="btn btn-secondary"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ========== Export with Error Boundary ==========
export default function AppWithErrorBoundary() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
