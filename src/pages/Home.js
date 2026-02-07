import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabasePublic as supabase } from '../config/supabase';
import { 
  Laptop, 
  Smartphone, 
  Monitor, 
  Headphones, 
  HardDrive, 
  Printer,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  ShoppingCart,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Award,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Truck
} from 'lucide-react';

import '../styles/Home.css';

// ========================================
// HOME TOAST NOTIFICATION COMPONENT
// ========================================
const HomeToastNotification = ({ message, type = 'success', onClose }) => {
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
    <div className={`home-toast-notification home-toast-${type} ${isExiting ? 'home-toast-exiting' : ''}`}>
      <div className="home-toast-content">
        <div className="home-toast-icon">
          {getToastIcon()}
        </div>
        <span className="home-toast-message">{message}</span>
        <button onClick={handleClose} className="home-toast-close" aria-label="Close notification">
          ×
        </button>
      </div>
      <div className="home-toast-progress"></div>
    </div>
  );
};

// ========================================
// OPTIMIZED PRODUCT CARD - INTERSECTION OBSERVER
// ========================================
const ProductCard = React.memo(({ product, onAddToCart, index }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const cardRef = useRef(null);
  const touchTimeoutRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
  }, [onAddToCart, product]);

  // Mobile tap to show/hide quick view
  const handleCardTap = useCallback(() => {
    if (window.innerWidth <= 768) {
      setShowQuickView(prev => !prev);
      
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      
      touchTimeoutRef.current = setTimeout(() => {
        setShowQuickView(false);
      }, 3000);
    }
  }, []);

  // Desktop hover handling
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth > 768) {
      setShowQuickView(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth > 768) {
      setShowQuickView(false);
    }
  }, []);

  const imageSrc = useMemo(() => {
    if (!isVisible) return '/api/placeholder/300/300';
    if (imageError) return '/api/placeholder/300/300';
    
    let url = product.image_url || '/api/placeholder/300/300';
    
    if (url.includes('postimg.cc') || url.includes('i.postimg.cc')) {
      return `${url}?quality=85&format=webp`;
    }
    
    return url;
  }, [isVisible, imageError, product.image_url]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(price);
  }, []);

  const discount = product.original_price && product.price < product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div 
      ref={cardRef}
      className="home-product-card"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={handleCardTap}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="home-product-image-container">
        {!imageLoaded && isVisible && (
          <div className="home-image-placeholder">
            <div className="home-loading-shimmer"></div>
          </div>
        )}
        
        {isVisible && (
          <img 
            src={imageSrc}
            alt={product.name}
            className={`home-product-image ${imageLoaded ? 'home-loaded' : ''}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            width="300"
            height="300"
            decoding="async"
          />
        )}
        
        {/* Badges */}
        <div className="home-product-badges">
          {product.featured && (
            <div className="home-badge home-badge-featured">
              <Award size={12} />
              <span>Featured</span>
            </div>
          )}
          {discount > 0 && (
            <div className="home-badge home-badge-discount">
              -{discount}%
            </div>
          )}
          {product.is_new && (
            <div className="home-badge home-badge-new">
              New
            </div>
          )}
        </div>
        
        {product.stock_quantity === 0 && (
          <div className="home-out-of-stock-overlay">
            <span className="home-out-of-stock-badge">Out of Stock</span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className={`home-product-quick-actions ${showQuickView ? 'home-quick-actions-visible' : ''}`}>
          <Link 
            to={`/product/${product.id}`}
            className="home-quick-action-btn"
            aria-label={`Quick view ${product.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={18} />
          </Link>
        </div>

        {/* Mobile Tap Indicator */}
        {window.innerWidth <= 768 && (
          <div className="home-mobile-tap-indicator"></div>
        )}
      </div>

      <div className="home-product-info">
        <div className="home-product-header">
          <span className="home-product-category">
            {product.category || 'Electronics'}
          </span>
          {product.rating && (
            <div className="home-product-rating">
              <Star size={12} fill="currentColor" />
              <span>{product.rating}</span>
            </div>
          )}
        </div>
        
        <h3 className="home-product-title">{product.name}</h3>
        
        <p className="home-product-specs">
          {product.short_description || 'High-quality tech product with excellent performance'}
        </p>
        
        <div className="home-product-price-section">
          <div className="home-price-group">
            <p className="home-product-price">{formatPrice(product.price || 0)}</p>
            {product.original_price && product.original_price > product.price && (
              <p className="home-product-price-original">{formatPrice(product.original_price)}</p>
            )}
          </div>
          
          <div className="home-product-stock">
            {product.stock_quantity > 0 ? (
              <span className="home-stock-badge home-stock-in">
                <Check size={14} />
                In Stock
              </span>
            ) : (
              <span className="home-stock-badge home-stock-out">
                <X size={14} />
                Out of Stock
              </span>
            )}
          </div>
        </div>
        
        <div className="home-product-actions">
          <button 
            className={`home-product-btn home-btn-primary ${product.stock_quantity === 0 ? 'home-btn-disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={product.stock_quantity === 0}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={16} />
            <span>{product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
          
          <Link 
            to={`/product/${product.id}`}
            className="home-product-btn home-btn-secondary"
            aria-label={`View details for ${product.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={16} />
            <span>View</span>
          </Link>
        </div>
      </div>
    </div>
  );
});

// ========================================
// ENHANCED HERO BANNER WITH CLICKABLE LINKS
// ========================================
const HeroBanner = React.memo(({ banners, currentIndex, onNavigate, onNext, onPrev }) => {
  const currentBanner = banners[currentIndex] || {};
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate(); // Now this will work

  const handleNavigation = useCallback((direction) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    if (direction === 'next') {
      onNext();
    } else {
      onPrev();
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, onNext, onPrev]);

  // Handle banner click
  const handleBannerClick = useCallback(() => {
    if (!currentBanner.link_type || currentBanner.link_type === 'none') {
      return; // No link, do nothing
    }

    if (currentBanner.link_type === 'internal' && currentBanner.link_url) {
      // Internal link - use navigate
      navigate(currentBanner.link_url);
    } else if (currentBanner.link_type === 'external' && currentBanner.link_url) {
      // External link - open in new tab
      window.open(currentBanner.link_url, '_blank', 'noopener,noreferrer');
    }
  }, [currentBanner, navigate]);

  // Determine if banner is clickable
  const isClickable = currentBanner.link_type && currentBanner.link_type !== 'none' && currentBanner.link_url;

  if (banners.length === 0) {
    return (
      <section className="home-hero home-hero-default">
        <div className="home-hero-overlay"></div>
        <div className="home-container">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <Zap size={16} />
              <span>Premium Technology</span>
            </div>
            <h1 className="home-hero-title">
              Your Trusted Source for <span className="home-hero-highlight">Premium Tech</span>
            </h1>
            <p className="home-hero-subtitle">
              Discover cutting-edge computers, laptops, and accessories from leading brands. Quality guaranteed, competitive prices.
            </p>
            <div className="home-hero-cta-group">
              <Link to="/products" className="home-hero-cta home-cta-primary">
                <span>Explore Products</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/products?sort=featured" className="home-hero-cta home-cta-secondary">
                <span>View Deals</span>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="home-hero-trust">
              <div className="home-hero-trust-item">
                <Shield size={18} />
                <span>Secure Payment</span>
              </div>
              <div className="home-hero-trust-item">
                <Truck size={18} />
                <span>Fast Delivery</span>
              </div>
              <div className="home-hero-trust-item">
                <Award size={18} />
                <span>Quality Assured</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={`home-hero ${isClickable ? 'home-hero-clickable' : ''}`}
      onClick={isClickable ? handleBannerClick : undefined}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : -1}
      onKeyPress={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBannerClick();
        }
      } : undefined}
      aria-label={isClickable ? `Click to ${currentBanner.link_type === 'external' ? 'visit external link' : 'navigate'}` : undefined}
    >
      <div className="home-hero-slider">
        <img
          src={currentBanner.displayImage}
          alt={currentBanner.title || 'Premium Technology Solutions'}
          className={`home-hero-bg-image ${isTransitioning ? 'home-hero-transitioning' : ''}`}
          fetchpriority="high"
          loading="eager"
          width="1920"
          height="600"
          decoding="sync"
        />
        <div className="home-hero-overlay"></div>
      </div>

      <div className="home-container">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <TrendingUp size={16} />
            <span>Trending Now</span>
          </div>
          <h1 className="home-hero-title">
            {currentBanner.title || 'Premium Technology Solutions'}
          </h1>
          <p className="home-hero-subtitle">
            {currentBanner.description || 'Discover our curated collection of high-performance computers and accessories'}
          </p>
          
          {/* Show CTAs only if banner is not clickable, or show custom CTA */}
          {!isClickable && (
            <div className="home-hero-cta-group">
              <Link to="/products" className="home-hero-cta home-cta-primary">
                <span>Shop Now</span>
                <ArrowRight size={20} />
              </Link>
              <Link to={`/products?category=${currentBanner.category || ''}`} className="home-hero-cta home-cta-secondary">
                <span>Learn More</span>
              </Link>
            </div>
          )}
          
          {/* Show click indicator if banner is clickable */}
          {isClickable && (
            <div className="home-hero-click-indicator">
              <span className="home-hero-click-text">
                Click to {currentBanner.link_type === 'external' ? 'visit' : 'explore'}
              </span>
              <ArrowRight size={20} className="home-hero-click-arrow" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            className="home-hero-arrow home-hero-arrow-left"
            onClick={(e) => {
              e.stopPropagation(); // Prevent banner click
              handleNavigation('prev');
            }}
            aria-label="Previous banner"
            disabled={isTransitioning}
          >
            <ChevronLeft size={28} />
          </button>
          
          <button
            className="home-hero-arrow home-hero-arrow-right"
            onClick={(e) => {
              e.stopPropagation(); // Prevent banner click
              handleNavigation('next');
            }}
            aria-label="Next banner"
            disabled={isTransitioning}
          >
            <ChevronRight size={28} />
          </button>

          {/* Dot Navigation */}
          <div className="home-hero-navigation">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`home-hero-dot ${index === currentIndex ? 'home-hero-dot-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent banner click
                  onNavigate(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
});



// ========================================
// ENHANCED CATEGORY GRID WITH LIVE COUNTS
// ========================================
const CategoryGrid = React.memo(({ onCategorySelect, categoryCounts, loadingCounts }) => {
  const categories = useMemo(() => [
    {
      id: 'laptops',
      name: 'Laptops',
      icon: Laptop,
      description: 'High-performance computing',
      color: '#2563eb'
    },
    {
      id: 'phones',
      name: 'Smartphones',
      icon: Smartphone,
      description: 'Latest mobile technology',
      color: '#059669'
    },
    {
      id: 'monitors',
      name: 'Monitors',
      icon: Monitor,
      description: 'Crystal clear displays',
      color: '#7c3aed'
    },
    {
      id: 'accessories',
      name: 'Accessories',
      icon: Headphones,
      description: 'Essential tech gear',
      color: '#ea580c'
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: HardDrive,
      description: 'Reliable data solutions',
      color: '#dc2626'
    },
    {
      id: 'printers',
      name: 'Printers',
      icon: Printer,
      description: 'Professional printing',
      color: '#0891b2'
    }
  ], []);

  return (
    <section className="home-category-section">
      <div className="home-container">
        <div className="home-section-header">
          <h2 className="home-section-title">Browse by Category</h2>
          <p className="home-section-subtitle">Find exactly what you need</p>
        </div>
        
        <div className="home-category-grid">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            const count = categoryCounts[category.id] || 0;
            
            return (
              <div
                key={category.id}
                className="home-category-card"
                onClick={() => onCategorySelect(category.id)}
                role="button"
                tabIndex={0}
                style={{ animationDelay: `${index * 0.1}s` }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onCategorySelect(category.id);
                  }
                }}
              >
                <div className="home-category-icon-wrapper">
                  <div 
                    className="home-category-icon" 
                    style={{ 
                      background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}25 100%)`,
                      borderColor: `${category.color}30`
                    }}
                  >
                    <IconComponent size={28} color={category.color} strokeWidth={2.5} />
                  </div>
                </div>
                
                <div className="home-category-content">
                  <h3 className="home-category-name">{category.name}</h3>
                  <p className="home-category-description">{category.description}</p>
                  <span className="home-category-count">
                    {loadingCounts ? (
                      <span className="home-count-shimmer">Loading...</span>
                    ) : (
                      `${count}${count >= 100 ? '+' : ''} product${count !== 1 ? 's' : ''}`
                    )}
                  </span>
                </div>
                
                <div className="home-category-arrow">
                  <ArrowRight size={18} strokeWidth={2.5} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

// ========================================
// ENHANCED PRODUCTS SECTION
// ========================================
const ProductsGridSection = React.memo(({ title, subtitle, products, viewAllLink, onAddToCart, icon: Icon }) => {
  if (products.length === 0) return null;

  return (
    <section className="home-products-section">
      <div className="home-container">
        <div className="home-section-header">
          <div className="home-section-title-group">
            <div className="home-section-icon">
              {Icon && <Icon size={28} />}
            </div>
            <div>
              <h2 className="home-section-title">{title}</h2>
              {subtitle && <p className="home-section-subtitle">{subtitle}</p>}
            </div>
          </div>
          <Link to={viewAllLink} className="home-view-all-link">
            <span>View All</span>
            <ArrowRight size={18} />
          </Link>
        </div>
        
        <div className="home-products-grid">
          {products.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

// ========================================
// TRUST INDICATORS
// ========================================
const TrustIndicators = React.memo(() => {
  const indicators = useMemo(() => [
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: 'Protected payments'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick & reliable shipping'
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: 'Authentic products only'
    },
    {
      icon: ThumbsUp,
      title: '24/7 Support',
      description: 'Always here to help'
    }
  ], []);

  return (
    <section className="home-trust-section">
      <div className="home-container">
        <div className="home-trust-grid">
          {indicators.map((indicator, index) => {
            const IconComponent = indicator.icon;
            return (
              <div key={index} className="home-trust-item">
                <div className="home-trust-icon">
                  <IconComponent size={22} strokeWidth={2.5} />
                </div>
                <div className="home-trust-content">
                  <h3 className="home-trust-title">{indicator.title}</h3>
                  <p className="home-trust-description">{indicator.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

// ========================================
// AFFILIATE SECTION
// ========================================
const AffiliateAnnouncement = React.memo(() => {
  return (
    <section className="home-affiliate-section">
      <div className="home-container">
        <div className="home-affiliate-card">
          <div className="home-affiliate-decoration"></div>
          <div className="home-affiliate-content">
            <div className="home-affiliate-header">
              <div className="home-affiliate-badge">
                <TrendingUp size={16} />
                <span>Partnership Program</span>
              </div>
              <h3 className="home-affiliate-title">
                Earn with Our Affiliate Program
              </h3>
            </div>
            
            <p className="home-affiliate-description">
              Join our growing network of partners and earn competitive commissions 
              on every sale. Start earning today with our premium tech products.
            </p>
            
            <div className="home-affiliate-features">
              <div className="home-affiliate-feature">
                <div className="home-affiliate-feature-icon">
                  <DollarSign size={18} />
                </div>
                <div>
                  <strong>5% Commission</strong>
                  <span>On all sales</span>
                </div>
              </div>
              <div className="home-affiliate-feature">
                <div className="home-affiliate-feature-icon">
                  <Users size={18} />
                </div>
                <div>
                  <strong>Large Catalog</strong>
                  <span>1000+ products</span>
                </div>
              </div>
              <div className="home-affiliate-feature">
                <div className="home-affiliate-feature-icon">
                  <Award size={18} />
                </div>
                <div>
                  <strong>Dedicated Support</strong>
                  <span>Always available</span>
                </div>
              </div>
            </div>
            
            <div className="home-affiliate-actions">
              <Link to="/affiliates" className="home-affiliate-cta">
                <span>Get Started</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/affiliates" className="home-affiliate-link">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

// ========================================
// LOADING STATE
// ========================================
const LoadingState = () => (
  <div className="home-loading-container">
    <div className="home-loading-content">
      <div className="home-loading-spinner"></div>
      <p className="home-loading-text">Loading premium products...</p>
    </div>
  </div>
);

// ========================================
// MAIN HOME COMPONENT
// ========================================
const Home = () => {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [popular, setPopular] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const bannerIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Toast handlers
  const showToast = useCallback((message, type = 'success') => {
    if (isMountedRef.current) {
      setToast({ message, type });
    }
  }, []);

  const closeToast = useCallback(() => {
    if (isMountedRef.current) {
      setToast(null);
    }
  }, []);

  // Banner navigation
  const goToNextBanner = useCallback(() => {
    setCurrentBannerIndex(prev => (prev >= banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const goToPrevBanner = useCallback(() => {
    setCurrentBannerIndex(prev => (prev <= 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const goToBanner = useCallback((index) => {
    setCurrentBannerIndex(index);
  }, []);

  // Auto-rotate banners
  const startBannerRotation = useCallback(() => {
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
    }

    if (banners.length > 1) {
      bannerIntervalRef.current = setInterval(() => {
        setCurrentBannerIndex(prev => (prev >= banners.length - 1 ? 0 : prev + 1));
      }, 6000);
    }
  }, [banners.length]);

  const stopBannerRotation = useCallback(() => {
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
      bannerIntervalRef.current = null;
    }
  }, []);

  // Category navigation
  const handleCategorySelect = useCallback((categoryId) => {
    window.location.href = `/products?category=${categoryId}`;
  }, []);

  // Load category counts from database
  const loadCategoryCounts = useCallback(async () => {
    try {
      setLoadingCounts(true);
      
      const categories = ['laptops', 'phones', 'monitors', 'accessories', 'storage', 'printers'];
      const counts = {};
      
      // Fetch counts for all categories in parallel
      const countPromises = categories.map(async (category) => {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category', category);
        
        if (!error) {
          counts[category] = count || 0;
        } else {
          counts[category] = 0;
        }
      });
      
      await Promise.all(countPromises);
      
      if (isMountedRef.current) {
        setCategoryCounts(counts);
      }
    } catch (error) {
      console.error('Error loading category counts:', error);
      // Set default counts on error
      setCategoryCounts({
        laptops: 0,
        phones: 0,
        monitors: 0,
        accessories: 0,
        storage: 0,
        printers: 0
      });
    } finally {
      if (isMountedRef.current) {
        setLoadingCounts(false);
      }
    }
  }, []);

  // Load data
  const loadHomepageData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Critical data first
      const [bannersResult, featuredResult] = await Promise.allSettled([
        supabase
          .from('banners')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(8)
      ]);

      // Process banners
      if (bannersResult.status === 'fulfilled') {
        const bannersData = bannersResult.value.data || [];
        const processedBanners = bannersData
          .map(banner => {
            const images = banner.images || (banner.image_url ? [banner.image_url] : []);
            return {
              ...banner,
              images,
              displayImage: images[0] || banner.image_url || ''
            };
          })
          .filter(banner => banner.displayImage);
        setBanners(processedBanners);
      }

      // Process featured
      if (featuredResult.status === 'fulfilled') {
        setFeaturedProducts(featuredResult.value.data || []);
      }

      // Load secondary data
      setTimeout(async () => {
        const [bestSellingResult, popularResult] = await Promise.allSettled([
          supabase
            .from('products')
            .select('*')
            .order('sales_count', { ascending: false })
            .limit(8),
          supabase
            .from('products')
            .select('*')
            .order('view_count', { ascending: false })
            .limit(8)
        ]);

        if (bestSellingResult.status === 'fulfilled') {
          setBestSelling(bestSellingResult.value.data || []);
        }

        if (popularResult.status === 'fulfilled') {
          setPopular(popularResult.value.data || []);
        }
      }, 100);

    } catch (error) {
      console.error('Error loading homepage:', error);
      showToast('Failed to load content. Please refresh.', 'error');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  // Add to cart
  const addToCart = useCallback((product) => {
    if (product.stock_quantity === 0) {
      showToast('This product is out of stock', 'error');
      return;
    }

    try {
      const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
      const existingIndex = cart.findIndex(item => item.id === product.id);
      
      if (existingIndex > -1) {
        const newQty = cart[existingIndex].quantity + 1;
        if (newQty > product.stock_quantity) {
          showToast(`Only ${product.stock_quantity} available`, 'error');
          return;
        }
        cart[existingIndex].quantity = newQty;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image_url: product.image_url,
          quantity: 1,
          stock_quantity: product.stock_quantity
        });
      }
      
      localStorage.setItem('deetech-cart', JSON.stringify(cart));
      showToast(`${product.name} added to cart`, 'success');
      
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Cart error:', error);
      showToast('Error adding to cart', 'error');
    }
  }, [showToast]);

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    loadHomepageData();
    loadCategoryCounts(); // Load live category counts

    return () => {
      isMountedRef.current = false;
      stopBannerRotation();
    };
  }, [loadHomepageData, loadCategoryCounts, stopBannerRotation]);

  useEffect(() => {
    startBannerRotation();
    return stopBannerRotation;
  }, [startBannerRotation, stopBannerRotation]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="home-page">
      {toast && (
        <HomeToastNotification
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
      
      <HeroBanner 
        banners={banners}
        currentIndex={currentBannerIndex}
        onNavigate={goToBanner}
        onNext={goToNextBanner}
        onPrev={goToPrevBanner}
      />

      <TrustIndicators />

      <CategoryGrid 
        onCategorySelect={handleCategorySelect}
        categoryCounts={categoryCounts}
        loadingCounts={loadingCounts}
      />

      {featuredProducts.length > 0 && (
        <ProductsGridSection 
          title="Featured Products"
          subtitle="Hand-picked premium devices"
          products={featuredProducts}
          viewAllLink="/products?sort=featured"
          onAddToCart={addToCart}
          icon={Star}
        />
      )}

      {bestSelling.length > 0 && (
        <ProductsGridSection 
          title="Best Sellers"
          subtitle="Most popular choices"
          products={bestSelling}
          viewAllLink="/products?sort=best-selling"
          onAddToCart={addToCart}
          icon={TrendingUp}
        />
      )}

      {popular.length > 0 && (
        <ProductsGridSection 
          title="Trending Now"
          subtitle="What's hot right now"
          products={popular}
          viewAllLink="/products?sort=popular"
          onAddToCart={addToCart}
          icon={Zap}
        />
      )}

      <AffiliateAnnouncement />
    </div>
  );
};

export default React.memo(Home);
