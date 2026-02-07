// src/utils/performance.js - FINAL FIXED VERSION

// Preload critical resources - FIXED VERSION
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // FIX: Remove problematic React preloads first
    removeProblematicPreloads();
    
    // Preload essential components that are used on most pages
    preloadEssentialComponents();
    preloadCriticalFonts();
  }
};

// NEW: Remove problematic preloads that cause warnings
const removeProblematicPreloads = () => {
  // Wait a bit for React to add its preloads, then remove them
  setTimeout(() => {
    const problematicPreloads = document.querySelectorAll(
      'link[rel="preload"][href*="main.css"], link[rel="preload"][href*="main.js"]'
    );
    
    problematicPreloads.forEach(link => {
      console.log('🚫 Removing problematic preload:', link.href);
      link.remove();
    });
    
    if (problematicPreloads.length > 0) {
      console.log(`✅ Removed ${problematicPreloads.length} problematic preloads`);
    }
  }, 100);
};

const preloadEssentialComponents = () => {
  const components = [
    () => import('../components/Layout/Navbar'),
    () => import('../components/Layout/Footer'),
    () => import('../components/LoadingSpinner'),
  ];
  
  components.forEach(importFn => {
    importFn().catch(() => {
      // Silent fail - it's just preloading
    });
  });
};

const preloadCriticalFonts = () => {
  // Preload Google Fonts or custom fonts if you use them
  const fontLinks = [
    // Add your font URLs here if needed
  ];
  
  fontLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'font';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Debounce utility for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// FIXED: Performance measurement utility
export const measurePerformance = () => {
  if ('performance' in window) {
    const navTiming = performance.getEntriesByType('navigation')[0];
    if (navTiming && navTiming.loadEventEnd > 0) {
      const loadTime = navTiming.loadEventEnd - navTiming.navigationStart;
      console.log('🚀 App Load Time:', Math.round(loadTime), 'ms');
      
      // Store metrics for analytics
      const metrics = {
        loadTime: Math.round(loadTime),
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem('perf-metrics', JSON.stringify(metrics));
      return loadTime;
    }
  }
  return null;
};

// Enhanced Core Web Vitals monitoring
export const monitorCoreWebVitals = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Monitor Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('🎯 LCP:', Math.round(lastEntry.startTime), 'ms');
        
        // Classify LCP performance
        if (lastEntry.startTime < 2500) {
          console.log('✅ LCP: Good (under 2.5s)');
        } else if (lastEntry.startTime < 4000) {
          console.log('⚠️ LCP: Needs improvement (2.5-4s)');
        } else {
          console.log('❌ LCP: Poor (over 4s)');
        }
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Monitor Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        let totalCLS = 0;
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            totalCLS += entry.value;
          }
        });
        
        console.log('📊 CLS:', totalCLS.toFixed(5));
        
        // Classify CLS performance
        if (totalCLS < 0.1) {
          console.log('✅ CLS: Excellent (under 0.1)');
        } else if (totalCLS < 0.25) {
          console.log('⚠️ CLS: Needs improvement (0.1-0.25)');
        } else {
          console.log('❌ CLS: Poor (over 0.25)');
        }
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          console.log('⚡ FID:', Math.round(entry.processingStart - entry.startTime), 'ms');
        });
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });

      console.log('📈 Core Web Vitals monitoring started');

    } catch (error) {
      console.warn('Core Web Vitals monitoring failed:', error);
    }
  } else {
    console.log('⚠️ PerformanceObserver not supported');
  }
};

// NEW: Quick performance check
export const quickPerfCheck = () => {
  if ('performance' in window) {
    const paintMetrics = performance.getEntriesByType('paint');
    paintMetrics.forEach(metric => {
      console.log(`🎨 ${metric.name}:`, Math.round(metric.startTime), 'ms');
    });
  }
};

// NEW: Clean up performance entries to prevent memory leaks
export const cleanupPerformance = () => {
  if ('performance' in window && performance.clearResourceTimings) {
    performance.clearResourceTimings();
  }
};