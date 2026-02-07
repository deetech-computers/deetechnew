// src/utils/imageOptimization.js
import { useState, useEffect, useRef } from 'react';

// Configuration
const IMAGE_CONFIG = {
  defaultQuality: 80,
  defaultWidth: 800,
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }
};

// Main image optimization function
export const optimizeImages = () => {
  if (typeof window === 'undefined') return;

  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        loadImageWithFallback(img);
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before image enters viewport
    threshold: 0.1
  });

  lazyImages.forEach(img => {
    // Add loading state
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease';
    imageObserver.observe(img);
  });
};

// Enhanced image loading with error handling
const loadImageWithFallback = (img) => {
  const originalSrc = img.dataset.src;
  
  if (!originalSrc) {
    console.warn('Image has data-src but no value:', img);
    return;
  }

  const image = new Image();
  
  image.onload = () => {
    img.src = originalSrc;
    img.style.opacity = '1';
    img.removeAttribute('data-src');
  };
  
  image.onerror = () => {
    console.error('Failed to load image:', originalSrc);
    img.style.opacity = '1'; // Still show the image area
    // You could set a placeholder image here
  };
  
  image.src = originalSrc;
};

// Enhanced WebP detection and optimization
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return '';
  
  const {
    width = IMAGE_CONFIG.defaultWidth,
    quality = IMAGE_CONFIG.defaultQuality,
    format = 'auto'
  } = options;

  // Handle Supabase storage URLs
  if (imageUrl.includes('supabase.co/storage')) {
    const url = new URL(imageUrl);
    
    // Remove existing query parameters to avoid conflicts
    url.search = '';
    
    // Add optimization parameters
    const params = new URLSearchParams();
    params.append('width', width);
    params.append('quality', quality);
    
    if (format === 'webp') {
      params.append('format', 'webp');
    }
    
    url.search = params.toString();
    return url.toString();
  }
  
  return imageUrl;
};

// Generate srcset for responsive images
export const generateSrcSet = (imageUrl, sizes = [400, 800, 1200]) => {
  if (!imageUrl) return '';
  
  return sizes
    .map(size => `${getOptimizedImageUrl(imageUrl, { width: size })} ${size}w`)
    .join(', ');
};

// FIXED: Smarter critical image detection
export const preloadCriticalImages = () => {
  if (typeof window === 'undefined') return;

  const criticalSelectors = [
    'img[data-critical]',
    '.hero img',
    '.banner img',
    'header img',
    '.above-fold img'
  ];

  let criticalImages = [];
  
  criticalSelectors.forEach(selector => {
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      const src = img.getAttribute('data-src') || img.src;
      if (src && !criticalImages.includes(src)) {
        criticalImages.push(src);
      }
    });
  });

  if (criticalImages.length === 0) {
    console.log('🖼️ No critical images to preload on this page');
    return;
  }

  // Use requestIdleCallback to avoid blocking main thread
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadImages(criticalImages);
    });
  } else {
    setTimeout(() => preloadImages(criticalImages), 100);
  }
};

const preloadImages = (imageUrls) => {
  imageUrls.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    console.log('🚀 Preloaded critical image:', src);
  });
};

// Enhanced React hook for image loading
export const useImageLoader = (src, options = {}) => {
  const [state, setState] = useState({
    loaded: false,
    error: false,
    progress: 0
  });
  
  const { lazy = true, critical = false } = options;
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    imgRef.current = img;

    let progressInterval;

    const handleLoad = () => {
      setState(prev => ({ ...prev, loaded: true, progress: 100 }));
      clearInterval(progressInterval);
    };

    const handleError = () => {
      setState(prev => ({ ...prev, error: true }));
      clearInterval(progressInterval);
    };

    // Simulate progress for better UX (optional)
    if (options.showProgress) {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 90) clearInterval(progressInterval);
        setState(prev => ({ ...prev, progress: Math.min(progress, 90) }));
      }, 100);
    }

    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Set fetch priority for critical images
    if (critical && 'fetchPriority' in img) {
      img.fetchPriority = 'high';
    }

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
      clearInterval(progressInterval);
      
      // Abort loading if component unmounts
      if (imgRef.current && !imgRef.current.complete) {
        imgRef.current.src = '';
      }
    };
  }, [src, critical, options.showProgress]);

  return state;
};

// Blur placeholder generation (for modern apps)
export const createBlurPlaceholder = async (imageUrl) => {
  // This would typically be done server-side
  // For client-side, you can use a small base64 placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlNWU1Ii8+PC9zdmc+';
};

// Initialize image optimization on app start
export const initImageOptimization = () => {
  if (typeof window !== 'undefined') {
    // Run initial optimization
    optimizeImages();
    
    // Re-run when new images are added (for SPAs)
    const observer = new MutationObserver(() => {
      optimizeImages();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }
};