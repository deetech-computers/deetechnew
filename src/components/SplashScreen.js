import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const timersRef = useRef([]);
  const mountedRef = useRef(false);

  const clearAllTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  };

  const checkNetworkSpeed = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
    return false;
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    console.log('🎬 Splash Screen Initialized');

    // Check if we should show splash
    const lastShown = sessionStorage.getItem('deetech_splash_last_shown');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    const shouldShow = !lastShown || (now - parseInt(lastShown)) > fiveMinutes;
    const slowNetwork = checkNetworkSpeed();
    
    setIsSlowNetwork(slowNetwork);

    if (shouldShow) {
      console.log('✨ Showing splash screen');
      setShowSplash(true);
      sessionStorage.setItem('deetech_splash_last_shown', now.toString());
      
      // Add body class to control visibility of other content
      document.body.classList.add('deetech-splash-body-active');
      
      // Calculate timing based on network speed
      const splashDuration = slowNetwork ? 1500 : 2200;
      const fadeDuration = slowNetwork ? 300 : 500;
      
      const hideTimer = setTimeout(() => {
        console.log('👋 Fading out...');
        setFadeOut(true);
        
        const removeTimer = setTimeout(() => {
          console.log('✅ Splash complete');
          setShowSplash(false);
          document.body.classList.remove('deetech-splash-body-active');
        }, fadeDuration);
        
        timersRef.current.push(removeTimer);
      }, splashDuration);
      
      timersRef.current.push(hideTimer);
      
    } else {
      console.log('🚀 Skipping splash (shown recently)');
      setShowSplash(false);
      document.body.classList.remove('deetech-splash-body-active');
    }

    return () => {
      console.log('🧹 Cleanup on unmount');
      clearAllTimers();
      document.body.classList.remove('deetech-splash-body-active');
    };
  }, []);

  // Safety timeout effect
  useEffect(() => {
    if (!showSplash) return;

    const safetyTimer = setTimeout(() => {
      console.log('⚠️ Safety timeout - forcing removal');
      setFadeOut(true);
      setTimeout(() => {
        setShowSplash(false);
        document.body.classList.remove('deetech-splash-body-active');
      }, 500);
    }, 3500);

    return () => clearTimeout(safetyTimer);
  }, [showSplash]);

  // Don't render anything if splash shouldn't show
  if (!showSplash) {
    return <>{children}</>;
  }

  return (
    <>
      <div 
        className={`deetech-splash-screen 
          ${isSlowNetwork ? 'deetech-splash-slow-network' : 'deetech-splash-branding'} 
          ${fadeOut ? 'deetech-splash-screen-fade-out' : ''}`}
      >
        <div className="deetech-splash-center">
          <div className="deetech-splash-brand-text">
            <span className="deetech-splash-brand-letter">D</span>
            <span className="deetech-splash-brand-letter">E</span>
            <span className="deetech-splash-brand-letter">E</span>
            <span className="deetech-splash-brand-letter">T</span>
            <span className="deetech-splash-brand-letter">E</span>
            <span className="deetech-splash-brand-letter">C</span>
            <span className="deetech-splash-brand-letter">H</span>
          </div>
          
          <div className="deetech-splash-brand-subtitle">
            COMPUTERS
          </div>
          
          <div className="deetech-splash-loading-indicator">
            <div className="deetech-splash-loading-dots">
              <span className="deetech-splash-loading-dot deetech-splash-dot-1"></span>
              <span className="deetech-splash-loading-dot deetech-splash-dot-2"></span>
              <span className="deetech-splash-loading-dot deetech-splash-dot-3"></span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render children - CSS will hide them when splash is active */}
      {children}
    </>
  );
};

export default SplashScreen;