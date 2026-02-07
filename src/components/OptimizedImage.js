// src/components/OptimizedImage.js
import React, { useState, useCallback } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  fallback = '/api/placeholder/300/200',
  lazy = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Optimize external images (postimg.cc)
  const getOptimizedSrc = (imageSrc) => {
    if (!imageSrc || imageSrc.includes('/api/placeholder')) return fallback;
    
    // Add optimization parameters for external images
    if (imageSrc.includes('postimg.cc')) {
      // You can add resize parameters if the service supports them
      // Example: return `${imageSrc}?quality=80&compress=true`;
      return imageSrc;
    }
    
    return imageSrc;
  };

  return (
    <div className={`image-container ${className}`}>
      {!imageLoaded && !imageError && (
        <div className="image-placeholder">
          <div className="loading-shimmer"></div>
        </div>
      )}
      <img
        src={getOptimizedSrc(imageError ? fallback : src)}
        alt={alt}
        width={width}
        height={height}
        className={`optimized-image ${imageLoaded ? 'loaded' : 'loading'} ${imageError ? 'error' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
      />
    </div>
  );
};

export default React.memo(OptimizedImage);