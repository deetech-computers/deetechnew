// src/utils/bundleOptimization.js
import React from 'react';

// Configuration for bundle optimization
const BUNDLE_CONFIG = {
  longTaskThreshold: 50, // ms
  chunkSize: 50, // operations per chunk
  maxCacheSize: 100, // memoization cache entries
};

// Fixed lazy loading - only include libraries you actually have installed
export const lazyLoadLibrary = (libraryName) => {
  const libraries = {
    // Only include libraries that are actually in your package.json
    // Remove date-fns and axios if you don't have them installed
    'lodash': () => import('lodash'),
    // Add other heavy libraries you actually use and have installed
  };

  const loader = libraries[libraryName];
  
  if (!loader) {
    console.warn(`Library "${libraryName}" not configured for lazy loading`);
    return Promise.reject(new Error(`Library "${libraryName}" not found`));
  }

  return loader().catch(error => {
    console.error(`Failed to lazy load ${libraryName}:`, error);
    throw error; // Re-throw to let calling code handle it
  });
};

// Enhanced memoization with cache limits and better key generation
export const memoize = (fn, options = {}) => {
  const {
    maxSize = BUNDLE_CONFIG.maxCacheSize,
    ttl, // time to live in ms
  } = options;

  const cache = new Map();
  const timestamps = new Map();

  return (...args) => {
    // Better key generation that handles circular references safely
    const key = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join('|');

    // Check cache validity
    const now = Date.now();
    if (ttl && timestamps.has(key)) {
      if (now - timestamps.get(key) > ttl) {
        cache.delete(key);
        timestamps.delete(key);
      }
    }

    if (cache.has(key)) {
      return cache.get(key);
    }

    // Clean cache if exceeding max size (LRU strategy)
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }

    const result = fn(...args);
    cache.set(key, result);
    if (ttl) {
      timestamps.set(key, now);
    }

    return result;
  };
};

// Enhanced bundle splitting with loading states
export const createLazyComponent = (importFn, options = {}) => {
  const {
    fallback: Fallback = () => <div>Loading...</div>,
    onError,
  } = options;

  const LazyComponent = React.lazy(() => 
    importFn()
      .then(module => ({ default: module.default || module }))
      .catch(error => {
        console.error('Failed to load component:', error);
        onError?.(error);
        
        if (options.fallbackModule) {
          return import(options.fallbackModule)
            .then(module => ({ default: module.default || module }))
            .catch(() => ({ default: Fallback }));
        }
        
        return { default: Fallback };
      })
  );

  return LazyComponent;
};

// Resource preloader with better priority management
export const preloadResources = (resources) => {
  if (typeof window === 'undefined') return;

  const preloaded = new Set();

  resources.forEach(({ type, url, priority = 'auto', crossOrigin = false }) => {
    // Avoid duplicate preloads
    if (preloaded.has(url)) return;
    preloaded.add(url);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (priority !== 'auto' && 'fetchPriority' in link) {
      link.fetchPriority = priority;
    }
    
    if (crossOrigin) {
      link.crossOrigin = 'anonymous';
    }

    link.onload = () => console.log(`✅ Preloaded: ${url}`);
    link.onerror = () => console.warn(`❌ Failed to preload: ${url}`);

    document.head.appendChild(link);
  });
};

// FIXED: Main thread optimization with proper scheduler reference
export const optimizeMainThread = () => {
  // Break up long running tasks into chunks
  const breakUpLongTask = (taskGenerator, chunkSize = BUNDLE_CONFIG.chunkSize) => {
    return new Promise((resolve, reject) => {
      const task = taskGenerator();
      
      const processChunk = () => {
        const startTime = performance.now();
        let operations = 0;

        try {
          while (operations < chunkSize) {
            const { value, done } = task.next();
            
            if (done) {
              resolve(value);
              return;
            }
            
            operations++;
            
            // Check if we're approaching the long task threshold
            if (performance.now() - startTime > BUNDLE_CONFIG.longTaskThreshold - 5) {
              setTimeout(processChunk, 0);
              return;
            }
          }
          
          // Continue with next chunk
          setTimeout(processChunk, 0);
        } catch (error) {
          reject(error);
        }
      };

      setTimeout(processChunk, 0);
    });
  };

  // FIXED: Defer non-critical work with proper window.scheduler reference
  const deferNonCriticalWork = (callback, options = {}) => {
    const {
      timeout = 1000,
      priority = 'low'
    } = options;

    // FIX: Use window.scheduler instead of just scheduler
    if (typeof window !== 'undefined' && window.scheduler?.postTask) {
      const priorityMap = {
        high: 'user-blocking',
        medium: 'user-visible', 
        low: 'background'
      };
      
      return window.scheduler.postTask(callback, {
        priority: priorityMap[priority] || 'background'
      });
    } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      return new Promise((resolve) => {
        requestIdleCallback(() => {
          const result = callback();
          resolve(result);
        }, { timeout });
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = callback();
          resolve(result);
        }, priority === 'high' ? 100 : timeout);
      });
    }
  };

  // Optimize expensive array operations
  const optimizeArrayOperation = (array, operation, chunkSize = 10) => {
    if (!array || !Array.isArray(array)) {
      return Promise.resolve([]);
    }

    return breakUpLongTask(function* () {
      const results = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        results.push(...chunk.map(operation));
        yield; // Allow interruption between chunks
      }
      return results;
    });
  };

  return {
    breakUpLongTask,
    deferNonCriticalWork,
    optimizeArrayOperation
  };
};

// Fixed Web Worker utility
export const createWorker = (workerFunction) => {
  if (typeof window === 'undefined' || !window.Worker) {
    return null;
  }

  try {
    // Convert function to string and create worker
    const functionString = workerFunction.toString();
    const workerBody = `
      self.onmessage = function(e) {
        try {
          const result = (${functionString})(e.data);
          self.postMessage({ success: true, data: result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;

    const blob = new Blob([workerBody], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    // Clean up URL when worker is terminated
    worker.cleanup = () => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();
    };

    return worker;
  } catch (error) {
    console.error('Failed to create worker:', error);
    return null;
  }
};

// Example worker function:
// const heavyCalculation = (data) => {
//   // Heavy computation here
//   return data.map(item => item * 2);
// };

// Enhanced performance monitoring
export const monitorLongTasks = (onLongTask) => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > BUNDLE_CONFIG.longTaskThreshold) {
        const taskInfo = {
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
          name: entry.name,
          attribution: entry.attribution || []
        };

        console.warn('🚨 Long task detected:', taskInfo);
        onLongTask?.(taskInfo);
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  } catch (error) {
    console.warn('Long task monitoring not supported:', error);
    return () => {};
  }
};

// Bundle analysis helper (for development)
export const analyzeBundle = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // This would integrate with your bundler's analysis tools
    console.log('📦 Bundle analysis available in build process');
  } catch (error) {
    console.warn('Bundle analysis not available:', error);
  }
};

// Initialize bundle optimization
export const initBundleOptimization = () => {
  if (typeof window === 'undefined') return;

  // Start monitoring long tasks
  const disconnect = monitorLongTasks((task) => {
    // You can send this to your analytics service
    console.warn('Long task affecting user experience:', task);
  });

  // Preload critical resources
  preloadResources([
    { type: 'font', url: '/fonts/critical.woff2', priority: 'high' },
    // Add other critical resources
  ]);

  return disconnect;
};

// Simple alternative if you don't need complex lazy loading
export const lazyLoadComponent = (importFn) => {
  return React.lazy(importFn);
};

// Quick fix for your immediate needs - minimal version
export const quickOptimize = {
  // Simple debounce utility
  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Simple throttle utility
  throttle: (func, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Basic lazy load
  lazy: (importFn) => React.lazy(importFn)
};