import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, supabasePublic } from '../config/supabase';
import { Copy, Check, Share2, Heart, Filter, Grid, List, ArrowUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProductsSearchInput from '../components/SearchInput';
// Add this import near the top with other imports
import ImagePlaceholder from '../components/ImagePlaceholder';
import '../App.css';
import '../styles/products.css';


// Products Toast Notification Component
const ProductsToastNotification = ({ message, type = 'success', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete before removing
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'info': return 'i';
      default: return '✓';
    }
  };

  return (
    <div className={`products-toast-notification products-toast-${type} ${isExiting ? 'products-toast-exiting' : ''}`}>
      <div className="products-toast-content">
        <div className="products-toast-icon">
          {getToastIcon()}
        </div>
        <span className="products-toast-message">{message}</span>
        <button onClick={handleClose} className="products-toast-close">
          ×
        </button>
      </div>
      <div className="products-toast-progress"></div>
    </div>
  );
};



// Products Safe clipboard utility
const productsSafeCopyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    const productsTextArea = document.createElement('textarea');
    productsTextArea.value = text;
    productsTextArea.style.position = 'fixed';
    productsTextArea.style.left = '-999999px';
    productsTextArea.style.top = '-999999px';
    document.body.appendChild(productsTextArea);
    productsTextArea.focus();
    productsTextArea.select();
    
    const productsSuccessful = document.execCommand('copy');
    document.body.removeChild(productsTextArea);
    
    if (productsSuccessful) return true;
    throw new Error('Products clipboard not available');
    
  } catch (error) {
    const productsCopyPrompt = window.prompt('Copy to clipboard: Ctrl+C, Enter', text);
    return !!productsCopyPrompt;
  }
};

// Products Optimized Product Card Component with Mobile Tap Support
const ProductsProductCard = React.memo(({ 
  product, 
  onAddToCart, 
  onToggleWishlist, 
  onCopyLink, 
  onShare, 
  copiedProductId, 
  affiliateCode, 
  isInWishlist, 
  wishlistLoading,
  user,
  viewMode = 'grid'
}) => {
  const [productsImageError, setProductsImageError] = useState(false);
  const [productsImageLoaded, setProductsImageLoaded] = useState(false);
  const [isShareActive, setIsShareActive] = useState(false);
  const cardRef = useRef(null);

  // Handle mobile tap for share buttons - ONLY on card body, not on buttons/links
  const handleCardBodyTap = useCallback((e) => {
    // Check if we're on mobile and if the click is on the card body itself
    // (not on buttons, links, or share buttons area)
    if (window.innerWidth <= 768) {
      // Check if the click target is actually the card body or image area
      const target = e.target;
      const isClickOnCardBody = 
        target === cardRef.current || 
        target.closest('.products-product-info') ||
        (target.closest('.products-product-image-container') && 
         !target.closest('button') && 
         !target.closest('a'));
      
      if (isClickOnCardBody) {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle share buttons
        setIsShareActive(!isShareActive);
      }
    }
  }, [isShareActive]);

  // Handle outside click to close share buttons
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isShareActive && cardRef.current && !cardRef.current.contains(e.target)) {
        setIsShareActive(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isShareActive]);

  // Close share buttons when user scrolls on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (isShareActive && window.innerWidth <= 768) {
        setIsShareActive(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isShareActive]);

  const productsHandleAddToCart = useCallback((e) => {
    e.stopPropagation(); // Prevent card tap from triggering
    onAddToCart(product);
  }, [onAddToCart, product]);

  const productsHandleToggleWishlist = useCallback((e) => {
    e.stopPropagation(); // Prevent card tap from triggering
    onToggleWishlist(product);
  }, [onToggleWishlist, product]);

  const productsHandleCopyLink = useCallback((e) => {
    e.stopPropagation(); // Prevent card tap from triggering
    onCopyLink(product);
    // Close share buttons after copying on mobile
    if (window.innerWidth <= 768) {
      setIsShareActive(false);
    }
  }, [onCopyLink, product]);

  const productsHandleShare = useCallback((e) => {
    e.stopPropagation(); // Prevent card tap from triggering
    onShare(product);
    // Close share buttons after sharing on mobile
    if (window.innerWidth <= 768) {
      setIsShareActive(false);
    }
  }, [onShare, product]);

  const productsGetOptimizedImageUrl = useCallback((url) => {
    if (!url || url.includes('/api/placeholder')) return 'ImagePlaceholder.URLS.PRODUCT_300';
    if (url.includes('postimg.cc') || url.includes('i.postimg.cc')) {
      return `${url}?quality=80&format=webp`;
    }
    return url;
  }, []);

  const productsImageSrc = productsGetOptimizedImageUrl(product.image_url);

  const productsFormatPrice = useCallback((price) => {
    return `GH₵ ${parseFloat(price).toLocaleString()}`;
  }, []);

  const productsGetCategoryDisplayName = useCallback((category) => {
    const productsCategoryNames = {
      'laptops': 'Laptops & Computers',
      'phones': 'Phones & Tablets',
      'monitors': 'Monitors & Displays',
      'accessories': 'Accessories',
      'storage': 'Storage Devices',
      'printers': 'Printers & Scanners'
    };
    return productsCategoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }, []);

  if (viewMode === 'list') {
    return (
      <div className="products-product-card products-list-view">
        <div className="products-product-image-container">
          {!productsImageLoaded && !productsImageError && (
            <div className="products-image-placeholder">
              <div className="products-loading-shimmer"></div>
            </div>
          )}
          <img 
            src={productsImageError ? 'ImagePlaceholder.URLS.PRODUCT_300' : productsImageSrc}
            alt={product.name}
            className={`products-product-image ${productsImageLoaded ? 'products-loaded' : 'products-loading'}`}
            onError={() => setProductsImageError(true)}
            onLoad={() => setProductsImageLoaded(true)}
            loading="lazy"
            width="250"
            height="250"
            decoding="async"
          />
          
          {product.featured && <span className="products-featured-badge">Featured</span>}
        </div>
        
        <div className="products-product-info">
          <div className="products-product-header">
            <div className="products-product-category-tag">{productsGetCategoryDisplayName(product.category)}</div>
            {user && (
              <button
                className={`products-wishlist-btn ${isInWishlist ? 'products-in-wishlist' : ''} ${wishlistLoading ? 'products-loading' : ''}`}
                onClick={productsHandleToggleWishlist}
                disabled={wishlistLoading}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
                {wishlistLoading && <div className="products-wishlist-spinner"></div>}
              </button>
            )}
          </div>
          
          <h3 className="products-product-title">{product.name}</h3>
          <p className="products-product-specs">{product.short_description}</p>
          <p className="products-product-description">{product.description}</p>
          
          <div className="products-product-price-section">
            <p className="products-product-price">{productsFormatPrice(product.price)}</p>
            <div className="products-product-stock">
              {product.stock_quantity > 0 ? (
                <span className="products-in-stock">✅ In Stock ({product.stock_quantity})</span>
              ) : (
                <span className="products-out-of-stock">❌ Out of Stock</span>
              )}
            </div>
          </div>
          
          <div className="products-product-actions">
            <button 
              className={`products-btn products-btn-primary ${product.stock_quantity === 0 ? 'products-btn-disabled' : ''}`}
              onClick={productsHandleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link 
              to={`/product/${product.id}`}
              className="products-btn products-btn-secondary"
              onClick={(e) => e.stopPropagation()} // Prevent card tap from triggering
            >
              View Details
            </Link>
            
            {affiliateCode && (
              <div className="products-share-buttons">
                <button
                  className={`products-product-share-btn products-product-copy-btn ${copiedProductId === product.id ? 'products-copied' : ''}`}
                  onClick={productsHandleCopyLink}
                  title="Copy product link with your affiliate code"
                >
                  {copiedProductId === product.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>Copy Link</span>
                </button>
                <button
                  className="products-product-share-btn products-product-share-main-btn"
                  onClick={productsHandleShare}
                  title="Share product with your affiliate code"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Products Grid View (default) - WITH MOBILE TAP SUPPORT
  return (
    <div 
      ref={cardRef}
      className={`products-product-card products-grid-view ${isShareActive ? 'products-share-active' : ''}`}
    >
      {/* Card body area that triggers share buttons on mobile */}
      <div 
        className="products-product-card-body"
        onClick={handleCardBodyTap}
        onTouchStart={(e) => {
          // Add touch feedback if needed
          if (window.innerWidth <= 768) {
            const target = e.target;
            const isTouchOnCardBody = 
              target === e.currentTarget || 
              target.closest('.products-product-info') ||
              (target.closest('.products-product-image-container') && 
               !target.closest('button') && 
               !target.closest('a'));
            
            if (isTouchOnCardBody) {
              e.currentTarget.style.transform = 'scale(0.98)';
            }
          }
        }}
        onTouchEnd={(e) => {
          if (window.innerWidth <= 768) {
            e.currentTarget.style.transform = '';
          }
        }}
      >
        <div className="products-product-image-container">
          {!productsImageLoaded && !productsImageError && (
            <div className="products-image-placeholder">
              <div className="products-loading-shimmer"></div>
            </div>
          )}
          <img 
            src={productsImageError ? 'ImagePlaceholder.URLS.PRODUCT_300' : productsImageSrc}
            alt={product.name}
            className={`products-product-image ${productsImageLoaded ? 'products-loaded' : 'products-loading'}`}
            onError={() => setProductsImageError(true)}
            onLoad={() => setProductsImageLoaded(true)}
            loading="lazy"
            width="300"
            height="300"
            decoding="async"
          />
          
          {product.featured && <span className="products-featured-badge">Featured</span>}
        </div>
        
        <div className="products-product-info">
          <div className="products-product-category-tag">{productsGetCategoryDisplayName(product.category)}</div>
          <h3 className="products-product-title">{product.name}</h3>
          <p className="products-product-specs">{product.short_description}</p>
          
          <div className="products-product-price-section">
            <p className="products-product-price">{productsFormatPrice(product.price)}</p>
            <div className="products-product-stock">
              {product.stock_quantity > 0 ? (
                <span className="products-product-stock-in">✅ In Stock ({product.stock_quantity})</span>
              ) : (
                <span className="products-product-stock-out">❌ Out of Stock</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons area */}
      <div className="products-product-actions">
        <button 
          className={`products-btn products-btn-primary ${product.stock_quantity === 0 ? 'products-btn-disabled' : ''}`}
          onClick={productsHandleAddToCart}
          disabled={product.stock_quantity === 0}
        >
          {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <Link 
          to={`/product/${product.id}`}
          className="products-btn products-btn-secondary"
          onClick={(e) => e.stopPropagation()} // Prevent card tap from triggering
        >
          View Details
        </Link>
      </div>

      {/* Floating action buttons (wishlist and share) */}
      <div className="products-floating-actions">
        {user && (
          <button
            className={`products-wishlist-btn ${isInWishlist ? 'products-in-wishlist' : ''} ${wishlistLoading ? 'products-loading' : ''}`}
            onClick={productsHandleToggleWishlist}
            disabled={wishlistLoading}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
            {wishlistLoading && <div className="products-wishlist-spinner"></div>}
          </button>
        )}
        
        {affiliateCode && (
          <div className="products-share-buttons">
            <button
              className={`products-product-share-btn products-product-copy-btn ${copiedProductId === product.id ? 'products-copied' : ''}`}
              onClick={productsHandleCopyLink}
              title="Copy product link with your affiliate code"
            >
              {copiedProductId === product.id ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button
              className="products-product-share-btn products-product-share-main-btn"
              onClick={productsHandleShare}
              title="Share product with your affiliate code"
            >
              <Share2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// Products Loading Component
const ProductsLoadingState = () => (
  <div className="products-container">
    <div className="products-loading-state">
      <div className="products-loading-spinner"></div>
      <p>Loading amazing products...</p>
    </div>
  </div>
);

// Products Full Screen Filter Overlay Component
const ProductsFullScreenFilterOverlay = ({ isOpen, onClose, children, onApplyFilters }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="products-fullscreen-filter-overlay">
      <div className="products-fullscreen-filter-backdrop" onClick={onClose}></div>
      <div className="products-fullscreen-filter-content">
        <div className="products-fullscreen-filter-header">
          <h2>Filter Products</h2>
          <div className="products-filter-actions">
            <button 
              className="products-apply-filters-btn"
              onClick={onApplyFilters}
            >
              Apply Filters
            </button>
            <button 
              className="products-close-filters-btn"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>
        <div className="products-fullscreen-filter-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Products Helper function to parse URL parameters
const productsParseUrlParams = (searchParams) => {
  const productsCategory = searchParams.get('category') || '';
  const productsSearch = searchParams.get('search') || '';
  const productsBrands = searchParams.get('brands') ? searchParams.get('brands').split(',') : [];
  const productsPriceRange = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : 25000;
  const productsSort = searchParams.get('sort') || 'name';
  
  return { productsCategory, productsSearch, productsBrands, productsPriceRange, productsSort };
};

const Products = () => {
  const [productsProducts, setProductsProducts] = useState([]);
  const [productsFilteredProducts, setProductsFilteredProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsToast, setProductsToast] = useState(null);
  const [productsSearchParams, setProductsSearchParams] = useSearchParams();
  const [productsCopiedProductId, setProductsCopiedProductId] = useState(null);
  const [productsAffiliateCode, setProductsAffiliateCode] = useState('');
  const [productsWishlist, setProductsWishlist] = useState([]);
  const [productsWishlistLoading, setProductsWishlistLoading] = useState(null);
  const [productsMobileFiltersOpen, setProductsMobileFiltersOpen] = useState(false);
  const [productsViewMode, setProductsViewMode] = useState('grid');
  const [productsShowBackToTop, setProductsShowBackToTop] = useState(false);
  const [productsCurrentPage, setProductsCurrentPage] = useState(1);
  const [productsIsMobile, setProductsIsMobile] = useState(window.innerWidth <= 768);
  
  const { user } = useAuth();
  
  const productsCategories = useMemo(() => ['laptops', 'phones', 'monitors', 'accessories', 'storage', 'printers'], []);
  
  const productsBrands = useMemo(() => ({
    laptops: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Microsoft', 'Samsung', 'Toshiba', 'MSI'],
    phones: ['Apple', 'Samsung', 'Google', 'Huawei', 'Xiaomi', 'Oppo', 'Vivo', 'Tecno', 'Infinix', 'Nokia'],
    monitors: ['Dell', 'HP', 'Samsung', 'LG', 'Acer', 'Asus', 'BenQ', 'ViewSonic', 'Philips', 'AOC'],
    accessories: ['Logitech', 'Microsoft', 'Apple', 'Samsung', 'Anker', 'JBL', 'Sony', 'Razer', 'Corsair', 'HyperX'],
    storage: ['Seagate', 'Western Digital', 'Samsung', 'Toshiba', 'Kingston', 'SanDisk', 'Crucial', 'Transcend'],
    printers: ['HP', 'Canon', 'Epson', 'Brother', 'Xerox', 'Lexmark', 'Ricoh', 'Kyocera']
  }), []);

  const productsPriceRanges = useMemo(() => ({
    laptops: { min: 1500, max: 25000, step: 500 },
    phones: { min: 150, max: 20000, step: 300 },
    monitors: { min: 300, max: 10000, step: 500 },
    accessories: { min: 50, max: 5000, step: 50 },
    storage: { min: 50, max: 3000, step: 50 },
    printers: { min: 500, max: 10000, step: 500 },
    default: { min: 0, max: 25000, step: 100 }
  }), []);

  // Products Search states - TWO SEPARATE STATES
  const [productsInputValue, setProductsInputValue] = useState(productsSearchParams.get('search') || ''); // What user is typing
  const [productsSearchQuery, setProductsSearchQuery] = useState(productsSearchParams.get('search') || ''); // Actual search term (after delay/Enter)

  // Products Temporary filter state for multiple selections
  const [productsTempFilters, setProductsTempFilters] = useState({
    category: productsSearchParams.get('category') || '',
    brands: productsSearchParams.get('brands') ? productsSearchParams.get('brands').split(',') : [],
    priceRange: productsSearchParams.get('maxPrice') ? parseInt(productsSearchParams.get('maxPrice')) : 25000,
    sort: productsSearchParams.get('sort') || 'name'
  });

  // Products Active filters state
  const [productsActiveFilters, setProductsActiveFilters] = useState({
    category: productsSearchParams.get('category') || '',
    brands: productsSearchParams.get('brands') ? productsSearchParams.get('brands').split(',') : [],
    priceRange: productsSearchParams.get('maxPrice') ? parseInt(productsSearchParams.get('maxPrice')) : 25000,
    sort: productsSearchParams.get('sort') || 'name'
  });

  // Products Enhanced URL parameter handling
  useEffect(() => {
    const { productsCategory, productsSearch, productsBrands, productsPriceRange, productsSort } = productsParseUrlParams(productsSearchParams);
    
    // Set both temp and active filters from URL
    const productsFiltersFromUrl = { category: productsCategory, brands: productsBrands, priceRange: productsPriceRange, sort: productsSort };
    setProductsTempFilters(productsFiltersFromUrl);
    setProductsActiveFilters(productsFiltersFromUrl);
    
    // Set search queries if present
    if (productsSearch) {
      setProductsInputValue(productsSearch);
      setProductsSearchQuery(productsSearch);
    }
  }, [productsSearchParams]);

  // Products Back to Top functionality
  useEffect(() => {
    const productsHandleScroll = () => {
      const productsScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setProductsShowBackToTop(productsScrollTop > 400);
    };

    window.addEventListener('scroll', productsHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', productsHandleScroll);
  }, []);

  // Products Detect mobile viewport
  useEffect(() => {
    const productsHandleResize = () => {
      setProductsIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', productsHandleResize, { passive: true });
    return () => window.removeEventListener('resize', productsHandleResize);
  }, []);

  // Products Auto-scroll to products when filters are applied from URL
  useEffect(() => {
    // If we have active filters (meaning we came from a footer link), scroll to products
    if (productsActiveFilters.category || productsSearchQuery) {
      setTimeout(() => {
        const productsSection = document.querySelector('.products-content');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [productsActiveFilters.category, productsSearchQuery]);

  const productsScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Products Load data
  useEffect(() => {
    productsLoadProducts();
    productsLoadAffiliateCode();
    if (user) productsLoadWishlist();
  }, [user]);

  // Products Filter products when active filters or ACTUAL search query change
  useEffect(() => {
    productsFilterProducts();
    setProductsCurrentPage(1); // Reset to first page when filters change
  }, [productsProducts, productsActiveFilters, productsSearchQuery]);

  const productsLoadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabasePublic
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProductsProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      productsShowToast('Failed to load products. Please try again.', 'error');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const productsLoadAffiliateCode = useCallback(async () => {
    try {
      if (user) {
        const { data: affiliate, error } = await supabase
          .from('affiliates')
          .select('affiliate_code')
          .eq('user_id', user.id)
          .single();

        if (!error && affiliate) {
          setProductsAffiliateCode(affiliate.affiliate_code);
        }
      }
    } catch (error) {
      console.error('Error loading affiliate code:', error);
    }
  }, [user]);

  const productsLoadWishlist = useCallback(async () => {
    try {
      if (!user) {
        setProductsWishlist([]);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)
        .limit(1000);

      if (error) {
        console.error('Wishlist error:', error);
        setProductsWishlist([]);
        return;
      }
      
      const productsWishlistIds = data?.map(item => 
        typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id
      ) || [];
      
      setProductsWishlist(productsWishlistIds);
    } catch (error) {
      console.error('Wishlist error:', error);
      setProductsWishlist([]);
    }
  }, [user]);

  const productsToggleWishlist = useCallback(async (product) => {
    if (productsWishlistLoading === product.id) return;
    
    setProductsWishlistLoading(product.id);
    try {
      if (!user) {
        productsShowToast('Please log in to manage your wishlist', 'error');
        return;
      }

      const productsProductId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
      const productsIsCurrentlyInWishlist = productsWishlist.includes(productsProductId);

      if (productsIsCurrentlyInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productsProductId);

        if (error && error.code !== 'PGRST116') throw error;
        
        setProductsWishlist(prev => prev.filter(id => id !== productsProductId));
        productsShowToast('Removed from wishlist', 'success');
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: productsProductId
          });

        if (error && error.code !== '23505') throw error;
        
        setProductsWishlist(prev => [...prev, productsProductId]);
        productsShowToast('Added to wishlist!', 'success');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      productsShowToast('Error updating wishlist. Please try again.', 'error');
    } finally {
      setProductsWishlistLoading(null);
    }
  }, [user, productsWishlistLoading, productsWishlist]);

  // Products Filter products with multiple criteria
  const productsFilterProducts = useCallback(() => {
    let productsFiltered = [...productsProducts];

    // Apply search filter (always active) - uses ACTUAL search query
    if (productsSearchQuery) {
      const productsSearchTerm = productsSearchQuery.toLowerCase().trim();
      const productsSearchTerms = productsSearchTerm.split(/\s+/).filter(term => term.length > 0);
      
      if (productsSearchTerms.length > 0) {
        productsFiltered = productsFiltered.filter(product => {
          const productsSearchableText = `
            ${product.name} 
            ${product.description} 
            ${product.category} 
            ${product.brand || ''}
            ${product.short_description}
          `.toLowerCase();
          
          return productsSearchTerms.every(term => productsSearchableText.includes(term));
        });
      }
    }

    // Apply category filter
    if (productsActiveFilters.category) {
      productsFiltered = productsFiltered.filter(product => product.category === productsActiveFilters.category);
    }

    // Apply brand filters (multiple brands)
    if (productsActiveFilters.brands.length > 0) {
      productsFiltered = productsFiltered.filter(product => 
        productsActiveFilters.brands.some(brand => 
          product.name.toLowerCase().includes(brand.toLowerCase()) ||
          product.brand?.toLowerCase() === brand.toLowerCase()
        )
      );
    }

    // Apply price filter
    productsFiltered = productsFiltered.filter(product => parseFloat(product.price) <= productsActiveFilters.priceRange);

    // Apply sorting
    switch (productsActiveFilters.sort) {
      case 'price-low':
        productsFiltered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        productsFiltered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'name':
      default:
        productsFiltered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setProductsFilteredProducts(productsFiltered);
  }, [productsProducts, productsActiveFilters, productsSearchQuery]);

  // Products Handle temporary filter changes
  const productsHandleTempFilterChange = useCallback((key, value) => {
    setProductsTempFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Products Handle brand selection (multiple)
  const productsHandleBrandToggle = useCallback((brand) => {
    setProductsTempFilters(prev => {
      const productsCurrentBrands = [...prev.brands];
      const productsBrandIndex = productsCurrentBrands.indexOf(brand);
      
      if (productsBrandIndex > -1) {
        productsCurrentBrands.splice(productsBrandIndex, 1);
      } else {
        productsCurrentBrands.push(brand);
      }
      
      return { ...prev, brands: productsCurrentBrands };
    });
  }, []);

  // Products Apply all filters at once
  const productsApplyFilters = useCallback(() => {
    setProductsActiveFilters(productsTempFilters);
    
    // Update URL params
    const productsParams = new URLSearchParams();
    if (productsTempFilters.category) productsParams.set('category', productsTempFilters.category);
    if (productsTempFilters.brands.length > 0) productsParams.set('brands', productsTempFilters.brands.join(','));
    if (productsSearchQuery) productsParams.set('search', productsSearchQuery); // Use ACTUAL search query
    productsParams.set('maxPrice', productsTempFilters.priceRange.toString());
    productsParams.set('sort', productsTempFilters.sort);
    
    setProductsSearchParams(productsParams);
    setProductsMobileFiltersOpen(false);
    
    productsShowToast('Filters applied successfully!', 'success');
  }, [productsTempFilters, productsSearchQuery, setProductsSearchParams]);

  // Products Clear all filters
  const productsClearAllFilters = useCallback(() => {
    const productsDefaultFilters = {
      category: '',
      brands: [],
      priceRange: 25000,
      sort: 'name'
    };
    
    setProductsTempFilters(productsDefaultFilters);
    setProductsActiveFilters(productsDefaultFilters);
    setProductsInputValue(''); // Clear input value
    setProductsSearchQuery(''); // Clear search query
    setProductsSearchParams({});
    setProductsMobileFiltersOpen(false);
    
    productsShowToast('All filters cleared', 'success');
  }, [setProductsSearchParams]);

  // Products Handle search input change (what user is typing)
  const productsHandleSearchChange = useCallback((value) => {
    setProductsInputValue(value);
    // DO NOT set searchQuery here - only update input value
    // Search will trigger after delay or Enter press
  }, []);

  // Products Handle search execution from SearchInput (after delay or Enter)
  const productsHandleSearch = useCallback((searchTerm) => {
    // Update the ACTUAL search query
    setProductsSearchQuery(searchTerm);
    
    // Update URL with search param
    const productsParams = new URLSearchParams(productsSearchParams);
    if (searchTerm) {
      productsParams.set('search', searchTerm);
    } else {
      productsParams.delete('search');
    }
    setProductsSearchParams(productsParams);
  }, [productsSearchParams, setProductsSearchParams]);

  // Products Handle search clear
  const productsHandleSearchClear = useCallback(() => {
    setProductsInputValue('');
    setProductsSearchQuery('');
    
    // Update URL
    const productsParams = new URLSearchParams(productsSearchParams);
    productsParams.delete('search');
    setProductsSearchParams(productsParams);
  }, [productsSearchParams, setProductsSearchParams]);

  const productsShowToast = useCallback((message, type = 'success') => {
    setProductsToast({ message, type });
  }, []);

  const productsCloseToast = useCallback(() => setProductsToast(null), []);

  // FIXED: Add to cart with proper stock validation
  const productsAddToCart = useCallback((product) => {
    // Check if product is out of stock
    if (product.stock_quantity === 0) {
      productsShowToast('❌ This product is out of stock', 'error');
      return;
    }

    const productsCart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const productsExistingItemIndex = productsCart.findIndex(item => item.id === product.id);
    
    // Check if adding one more would exceed stock
    if (productsExistingItemIndex > -1) {
      const currentQuantity = productsCart[productsExistingItemIndex].quantity;
      const newQuantity = currentQuantity + 1;
      
      if (newQuantity > product.stock_quantity) {
        productsShowToast(`❌ Maximum available quantity (${product.stock_quantity}) already in cart`, 'error');
        return;
      }
      
      productsCart[productsExistingItemIndex].quantity = newQuantity;
    } else {
      productsCart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url,
        quantity: 1,
        stock_quantity: product.stock_quantity
      });
    }
    
    localStorage.setItem('deetech-cart', JSON.stringify(productsCart));
    productsShowToast(`🎉 ${product.name} added to cart!`, 'success');
    
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      window.dispatchEvent(new Event('storage'));
    });
  }, [productsShowToast]);

  const productsCopyProductLink = useCallback(async (product) => {
    const productsProductUrl = `${window.location.origin}/product/${product.id}`;
    let productsShareText = `${product.name} - GH₵ ${parseFloat(product.price).toLocaleString()}\n${productsProductUrl}`;
    
    if (productsAffiliateCode) {
      productsShareText += `\n\nUse code "${productsAffiliateCode}" at checkout for great deals! 🚀`;
    }
    
    try {
      const productsSuccess = await productsSafeCopyToClipboard(productsShareText);
      
      if (productsSuccess) {
        setProductsCopiedProductId(product.id);
        productsShowToast(`Product link copied! ${productsAffiliateCode ? 'Your affiliate code is included!' : ''}`, 'success');
        setTimeout(() => setProductsCopiedProductId(null), 2000);
      } else {
        productsShowToast('📋 Please copy the link manually from the prompt', 'info');
      }
    } catch (error) {
      productsShowToast('Failed to copy link', 'error');
    }
  }, [productsAffiliateCode, productsShowToast]);

  const productsShareProduct = useCallback(async (product) => {
    const productsProductUrl = `${window.location.origin}/product/${product.id}`;
    let productsShareText = `Check out this amazing product from DEETECH COMPUTERS!\n\n${product.name} - GH₵ ${parseFloat(product.price).toLocaleString()}\n${product.short_description}\n\n${productsProductUrl}`;
    
    if (productsAffiliateCode) {
      productsShareText += `\n\nUse my code "${productsAffiliateCode}" at checkout for great deals! I'll also earn commission! 🚀`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: productsShareText,
          url: productsProductUrl,
        });
        productsShowToast('Product shared successfully!', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          const productsSuccess = await productsSafeCopyToClipboard(productsShareText);
          if (productsSuccess) {
            productsShowToast(`Product link copied! ${productsAffiliateCode ? 'Your affiliate code is included!' : ''}`, 'success');
          }
        }
      }
    } else {
      const productsSuccess = await productsSafeCopyToClipboard(productsShareText);
      if (productsSuccess) {
        productsShowToast(`Product link copied! ${productsAffiliateCode ? 'Your affiliate code is included!' : ''}`, 'success');
      }
    }
  }, [productsAffiliateCode, productsShowToast]);

  const productsGetCategoryDisplayName = useCallback((category) => {
    const productsCategoryNames = {
      'laptops': 'Laptops & Computers',
      'phones': 'Phones & Tablets',
      'monitors': 'Monitors & Displays',
      'accessories': 'Accessories',
      'storage': 'Storage Devices',
      'printers': 'Printers & Scanners'
    };
    return productsCategoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }, []);

  const productsGetAvailableBrands = useMemo(() => {
    if (!productsTempFilters.category) return [];
    return productsBrands[productsTempFilters.category] || [];
  }, [productsTempFilters.category, productsBrands]);

  const productsGetCurrentPriceRange = useMemo(() => {
    if (productsTempFilters.category && productsPriceRanges[productsTempFilters.category]) {
      return productsPriceRanges[productsTempFilters.category];
    }
    return productsPriceRanges.default;
  }, [productsTempFilters.category, productsPriceRanges]);

  const productsFormatPrice = useCallback((price) => {
    return `GH₵ ${parseFloat(price).toLocaleString()}`;
  }, []);

  const productsCurrentPriceRange = productsGetCurrentPriceRange;

  const productsGetSliderBackground = useCallback((price) => {
    const productsPercentage = ((price - productsCurrentPriceRange.min) / (productsCurrentPriceRange.max - productsCurrentPriceRange.min)) * 100;
    return {
      background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${productsPercentage}%, var(--gray-300) ${productsPercentage}%, var(--gray-300) 100%)`
    };
  }, [productsCurrentPriceRange]);

  // Products Check if we have active filters - uses ACTUAL search query
  const productsHasActiveFilters = productsActiveFilters.category || productsActiveFilters.brands.length > 0 || productsActiveFilters.priceRange < 25000 || productsSearchQuery;

  // Products Pagination calculations
  const productsProductsPerPage = productsIsMobile ? 4 : 6;
  const productsTotalPages = Math.ceil(productsFilteredProducts.length / productsProductsPerPage);
  const productsStartIndex = (productsCurrentPage - 1) * productsProductsPerPage;
  const productsEndIndex = productsStartIndex + productsProductsPerPage;
  const productsPaginatedProducts = productsFilteredProducts.slice(productsStartIndex, productsEndIndex);

  const productsGoToNextPage = () => {
    if (productsCurrentPage < productsTotalPages) {
      setProductsCurrentPage(prev => prev + 1);
      productsScrollToTop();
    }
  };

  const productsGoToPreviousPage = () => {
    if (productsCurrentPage > 1) {
      setProductsCurrentPage(prev => prev - 1);
      productsScrollToTop();
    }
  };

  if (productsLoading) return <ProductsLoadingState />;

  // Products Filter sidebar content for full screen overlay
  const productsFilterSidebarContent = (
    <>
      {/* Products Category Filter */}
      <div className="products-filter-group">
        <label>Category</label>
        <select 
          value={productsTempFilters.category}
          onChange={(e) => productsHandleTempFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {productsCategories.map(category => (
            <option key={category} value={category}>
              {productsGetCategoryDisplayName(category)}
            </option>
          ))}
        </select>
      </div>

      {/* Products Brand Filter - Multiple Selection */}
      {productsTempFilters.category && productsGetAvailableBrands.length > 0 && (
        <div className="products-filter-group">
          <label>Brands ({productsTempFilters.brands.length} selected)</label>
          <div className="products-brand-options-grid">
            {productsGetAvailableBrands.map(brand => (
              <button
                key={brand}
                className={`products-brand-option ${productsTempFilters.brands.includes(brand) ? 'products-active' : ''}`}
                onClick={() => productsHandleBrandToggle(brand)}
              >
                {brand}
                {productsTempFilters.brands.includes(brand) && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Price Filter */}
      <div className="products-filter-group">
        <label>Max Price: {productsFormatPrice(productsTempFilters.priceRange)}</label>
        <div className="products-price-slider-container">
          <input
            type="range"
            min={productsCurrentPriceRange.min}
            max={productsCurrentPriceRange.max}
            step={productsCurrentPriceRange.step}
            value={productsTempFilters.priceRange}
            onChange={(e) => productsHandleTempFilterChange('priceRange', parseInt(e.target.value))}
            className="products-price-slider"
            style={productsGetSliderBackground(productsTempFilters.priceRange)}
          />
          <div className="products-price-labels">
            <span>{productsFormatPrice(productsCurrentPriceRange.min)}</span>
            <span>{productsFormatPrice(productsCurrentPriceRange.max)}</span>
          </div>
        </div>
      </div>

      {/* Products Sort Filter */}
      <div className="products-filter-group">
        <label>Sort By</label>
        <select 
          value={productsTempFilters.sort}
          onChange={(e) => productsHandleTempFilterChange('sort', e.target.value)}
        >
          <option value="name">Name A-Z</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* Products Selected Filters Preview */}
      {(productsTempFilters.category || productsTempFilters.brands.length > 0 || productsTempFilters.priceRange < 25000) && (
        <div className="products-selected-filters-preview">
          <h4>Selected Filters:</h4>
          <div className="products-selected-filter-tags">
            {productsTempFilters.category && (
              <span className="products-filter-tag">
                {productsGetCategoryDisplayName(productsTempFilters.category)}
              </span>
            )}
            {productsTempFilters.brands.map(brand => (
              <span key={brand} className="products-filter-tag">
                {brand}
              </span>
            ))}
            {productsTempFilters.priceRange < 25000 && (
              <span className="products-filter-tag">
                Under {productsFormatPrice(productsTempFilters.priceRange)}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Toast Notification - RENDERED OUTSIDE THE PAGE CONTENT */}
      {productsToast && (
        <ProductsToastNotification
          message={productsToast.message}
          type={productsToast.type}
          onClose={productsCloseToast}
        />
      )}
    
      <div className="products-page">
        
        {/* Products Page Header */}
        <div className="products-page-header">
          <div className="products-container">
            <h1>Our Products</h1>
            <p>Discover our wide range of quality computers and accessories</p>
            
            {/* Products Clean Search Bar using SearchInput component */}
            <div className="products-sticky-search-container">
              <ProductsSearchInput
                value={productsInputValue} // Use inputValue for what user is typing
                onChange={productsHandleSearchChange}
                onSearch={productsHandleSearch} // Called after 15s or Enter
                onClear={productsHandleSearchClear}
                placeholder="Search products by name, brand, category..."
                className="products-search-input"
                delay={6000} // 15 seconds
                minChars={2} // Minimum 2 characters
              />
              
              <div className="products-header-controls">
                <button 
                  className="products-filter-toggle-btn"
                  onClick={() => setProductsMobileFiltersOpen(true)}
                >
                  <Filter size={16} />
                  Filters
                  {productsHasActiveFilters && <span className="products-filter-indicator"></span>}
                </button>
                
                {/* Products View Mode Toggle */}
                <div className="products-view-mode-toggle">
                  <button
                    className={`products-view-mode-btn ${productsViewMode === 'grid' ? 'products-active' : ''}`}
                    onClick={() => setProductsViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    className={`products-view-mode-btn ${productsViewMode === 'list' ? 'products-active' : ''}`}
                    onClick={() => setProductsViewMode('list')}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {productsAffiliateCode && (
              <div className="products-affiliate-notice">
                <div className="products-affiliate-badge">
                  <Share2 size={16} />
                  <span>Affiliate Mode Active - Your code: <strong>{productsAffiliateCode}</strong></span>
                </div>
                <p className="products-affiliate-help">
                  Share products with your affiliate code automatically included!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="products-container">
          <div className="products-layout">
            {/* Products Full Screen Filter Overlay */}
            <ProductsFullScreenFilterOverlay 
              isOpen={productsMobileFiltersOpen} 
              onClose={() => setProductsMobileFiltersOpen(false)}
              onApplyFilters={productsApplyFilters}
            >
              {productsFilterSidebarContent}
            </ProductsFullScreenFilterOverlay>

            {/* Products Content */}
            <div className="products-content">
              {/* Products Summary */}
              <div className="products-summary">
                <p>
                  Showing <strong>{productsStartIndex + 1}-{Math.min(productsEndIndex, productsFilteredProducts.length)}</strong> of <strong>{productsFilteredProducts.length}</strong> products
                  {productsHasActiveFilters && ' (filtered)'}
                  {productsSearchQuery && ` for "${productsSearchQuery}"`}
                </p>
                
                {/* Products Active Filters Display */}
                {productsHasActiveFilters && (
                  <div className="products-active-filters-display">
                    <div className="products-active-filters-header">
                      <span>Active Filters:</span>
                      <button onClick={productsClearAllFilters} className="products-clear-all-btn">
                        Clear All
                      </button>
                    </div>
                    <div className="products-active-filter-tags">
                      {productsActiveFilters.category && (
                        <span className="products-filter-tag">
                          {productsGetCategoryDisplayName(productsActiveFilters.category)}
                          <button onClick={() => {
                            setProductsActiveFilters(prev => ({ ...prev, category: '' }));
                            setProductsTempFilters(prev => ({ ...prev, category: '' }));
                          }}>×</button>
                        </span>
                      )}
                      {productsActiveFilters.brands.map(brand => (
                        <span key={brand} className="products-filter-tag">
                          {brand}
                          <button onClick={() => {
                            const productsNewBrands = productsActiveFilters.brands.filter(b => b !== brand);
                            setProductsActiveFilters(prev => ({ ...prev, brands: productsNewBrands }));
                            setProductsTempFilters(prev => ({ ...prev, brands: productsNewBrands }));
                          }}>×</button>
                        </span>
                      ))}
                      {productsActiveFilters.priceRange < 25000 && (
                        <span className="products-filter-tag">
                          Under {productsFormatPrice(productsActiveFilters.priceRange)}
                          <button onClick={() => {
                            setProductsActiveFilters(prev => ({ ...prev, priceRange: 25000 }));
                            setProductsTempFilters(prev => ({ ...prev, priceRange: 25000 }));
                          }}>×</button>
                        </span>
                      )}
                      {productsSearchQuery && (
                        <span className="products-filter-tag">
                          Search: "{productsSearchQuery}"
                          <button onClick={() => productsHandleSearchClear()}>×</button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Products Grid/List */}
              <div className="products-display">
                {productsPaginatedProducts.length > 0 ? (
                  <>
                    <div className={productsViewMode === 'grid' ? 'products-grid-container' : 'products-list-container'}>
                      {productsPaginatedProducts.map(product => (
                        <ProductsProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={productsAddToCart}
                          onToggleWishlist={productsToggleWishlist}
                          onCopyLink={productsCopyProductLink}
                          onShare={productsShareProduct}
                          copiedProductId={productsCopiedProductId}
                          affiliateCode={productsAffiliateCode}
                          isInWishlist={productsWishlist.includes(typeof product.id === 'string' ? parseInt(product.id) : product.id)}
                          wishlistLoading={productsWishlistLoading === product.id}
                          user={user}
                          viewMode={productsViewMode}
                        />
                      ))}
                    </div>

                    {/* Products Pagination Controls */}
                    {productsTotalPages > 1 && (
                      <div className="products-pagination-controls">
                        <button 
                          className="products-btn products-btn-secondary products-pagination-btn"
                          onClick={productsGoToPreviousPage}
                          disabled={productsCurrentPage === 1}
                        >
                          Previous
                        </button>
                        <div className="products-pagination-info">
                          <span>Page <strong>{productsCurrentPage}</strong> of <strong>{productsTotalPages}</strong></span>
                        </div>
                        <button 
                          className="products-btn products-btn-primary products-pagination-btn"
                          onClick={productsGoToNextPage}
                          disabled={productsCurrentPage === productsTotalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="products-empty-state">
                    <h3>No Products Found</h3>
                    <p>
                      {productsSearchQuery 
                        ? `No products found for "${productsSearchQuery}"`
                        : productsActiveFilters.category
                        ? `No products found in ${productsGetCategoryDisplayName(productsActiveFilters.category)} category`
                        : 'No products available at the moment.'
                      }
                      {productsActiveFilters.brands.length > 0 && ` with brands: ${productsActiveFilters.brands.join(', ')}`}
                      {productsActiveFilters.priceRange < 25000 && ` under ${productsFormatPrice(productsActiveFilters.priceRange)}`}
                    </p>
                    <button onClick={productsClearAllFilters} className="products-btn products-btn-primary">
                      View All Products
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;
