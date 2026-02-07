import React from 'react';
import { Package, Image as ImageIcon, ShoppingBag, Laptop, Smartphone } from 'lucide-react';

/**
 * Production-Ready Image Placeholder Component
 * 
 * A fallback component for missing or failed images across the application.
 * Provides visual feedback when images don't load or data is offline.
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Type of placeholder ('product', 'banner', 'category', 'avatar', 'general')
 * @param {number} props.width - Width in pixels (default: 300)
 * @param {number} props.height - Height in pixels (default: 300)
 * @param {string} props.text - Custom text to display
 * @param {string} props.className - Additional CSS classes
 * @param {React.Component} props.icon - Custom icon component
 * @param {string} props.iconColor - Icon color (default: gradient blue)
 * @param {boolean} props.showText - Whether to show text (default: true)
 * @param {boolean} props.animated - Whether to show shimmer animation (default: false)
 * 
 * @example
 * import ImagePlaceholder from '../components/ImagePlaceholder';
 * 
 * // Simple usage
 * <ImagePlaceholder type="product" />
 * 
 * // Custom size
 * <ImagePlaceholder type="banner" width={800} height={400} />
 * 
 * // With custom text
 * <ImagePlaceholder type="product" text="Product Image" />
 * 
 * // As fallback in img tag
 * <img 
 *   src={imageUrl || ImagePlaceholder.getDataURL('product')} 
 *   alt="Product" 
 * />
 */

const ImagePlaceholder = ({ 
  type = 'general',
  width = 300,
  height = 300,
  text,
  className = '',
  icon: CustomIcon,
  iconColor,
  showText = true,
  animated = false
}) => {
  // Configuration for different placeholder types
  const configs = {
    product: {
      icon: Package,
      text: 'Product Image',
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      bgColor: '#f8fafc'
    },
    banner: {
      icon: ImageIcon,
      text: 'Banner Image',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      bgColor: '#faf5ff'
    },
    category: {
      icon: ShoppingBag,
      text: 'Category',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      bgColor: '#f0fdf4'
    },
    avatar: {
      icon: ImageIcon,
      text: 'User',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
      bgColor: '#fef2f2'
    },
    laptop: {
      icon: Laptop,
      text: 'Laptop',
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      bgColor: '#f8fafc'
    },
    phone: {
      icon: Smartphone,
      text: 'Smartphone',
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      bgColor: '#f8fafc'
    },
    general: {
      icon: ImageIcon,
      text: 'Image',
      gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
      bgColor: '#f1f5f9'
    }
  };

  const config = configs[type] || configs.general;
  const Icon = CustomIcon || config.icon;
  const displayText = text || config.text;
  const iconSize = Math.min(width, height) * 0.3;

  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: config.bgColor,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '2px dashed #e2e8f0',
    position: 'relative',
    overflow: 'hidden'
  };

  const iconWrapperStyle = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: '50%',
    background: config.gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: showText ? '12px' : '0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const textStyle = {
    fontSize: `${Math.max(12, width * 0.04)}px`,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textAlign: 'center',
    padding: '0 16px'
  };

  const shimmerStyle = animated ? {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shimmer 2s infinite'
  } : {};

  return (
    <div 
      className={`image-placeholder ${className}`} 
      style={containerStyle}
      role="img"
      aria-label={displayText}
    >
      {animated && (
        <>
          <style>{`
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
          `}</style>
          <div style={shimmerStyle}></div>
        </>
      )}
      
      <div style={iconWrapperStyle}>
        <Icon 
          size={iconSize * 0.6} 
          color={iconColor || 'white'}
          strokeWidth={2}
        />
      </div>
      
      {showText && (
        <span style={textStyle}>{displayText}</span>
      )}
    </div>
  );
};

/**
 * Generate a data URL for use as img src fallback
 * @param {string} type - Placeholder type
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {string} Data URL
 */
ImagePlaceholder.getDataURL = (type = 'general', width = 300, height = 300) => {
  const configs = {
    product: { color: '#3b82f6', bg: '#f8fafc' },
    banner: { color: '#a78bfa', bg: '#faf5ff' },
    category: { color: '#10b981', bg: '#f0fdf4' },
    avatar: { color: '#f87171', bg: '#fef2f2' },
    laptop: { color: '#3b82f6', bg: '#f8fafc' },
    phone: { color: '#3b82f6', bg: '#f8fafc' },
    general: { color: '#94a3b8', bg: '#f1f5f9' }
  };

  const config = configs[type] || configs.general;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${config.bg}"/>
      <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="#e2e8f0" stroke-width="4" stroke-dasharray="10,5" rx="8"/>
      <circle cx="${width/2}" cy="${height/2 - 20}" r="${Math.min(width, height) * 0.15}" fill="${config.color}"/>
      <text x="${width/2}" y="${height/2 + 30}" font-family="system-ui, sans-serif" font-size="${Math.max(12, width * 0.04)}" fill="#64748b" text-anchor="middle" font-weight="600">
        ${type.charAt(0).toUpperCase() + type.slice(1)} Image
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Get placeholder URL for different types and sizes
 * @param {string} type - Placeholder type
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {string} Placeholder URL
 */
ImagePlaceholder.getPlaceholderURL = (type = 'product', width = 300, height = 300) => {
  return ImagePlaceholder.getDataURL(type, width, height);
};

/**
 * Common placeholder URLs for quick access
 */
ImagePlaceholder.URLS = {
  PRODUCT_300: ImagePlaceholder.getDataURL('product', 300, 300),
  PRODUCT_500: ImagePlaceholder.getDataURL('product', 500, 500),
  BANNER_1920: ImagePlaceholder.getDataURL('banner', 1920, 600),
  BANNER_800: ImagePlaceholder.getDataURL('banner', 800, 400),
  CATEGORY_200: ImagePlaceholder.getDataURL('category', 200, 200),
  AVATAR_100: ImagePlaceholder.getDataURL('avatar', 100, 100),
  LAPTOP_400: ImagePlaceholder.getDataURL('laptop', 400, 400),
  PHONE_300: ImagePlaceholder.getDataURL('phone', 300, 300),
  GENERAL_300: ImagePlaceholder.getDataURL('general', 300, 300)
};

export default ImagePlaceholder;