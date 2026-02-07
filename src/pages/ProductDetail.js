import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, supabasePublic } from '../config/supabase';
import { ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight, Copy, Check, Share2, Heart, Star, Truck, Shield, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import '../styles/productdetail.css';

// Product Detail Enhanced Toast Notification Component
const ProductDetailToastNotification = ({ message, type = 'success', onClose }) => {
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
    <div className={`productdetail-toast-notification productdetail-toast-${type} ${isExiting ? 'productdetail-toast-exiting' : ''}`}>
      <div className="productdetail-toast-content">
        <div className="productdetail-toast-icon">
          {getToastIcon()}
        </div>
        <span className="productdetail-toast-message">{message}</span>
        <button onClick={handleClose} className="productdetail-toast-close">
          ×
        </button>
      </div>
      <div className="productdetail-toast-progress"></div>
    </div>
  );
};



// Enhanced Image Gallery Component - WITHOUT ZOOM
const ImageGallery = ({ images, isFeatured }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        nextImage(); // Swipe left
      } else {
        prevImage(); // Swipe right
      }
    }
    
    setTouchStart(null);
  };

  if (!images || images.length === 0) {
    return (
      <div className="image-gallery">
        <div className="main-image-container">
          {isFeatured && (
            <span className="featured-badge">Featured</span>
          )}
          <img 
            src="/api/placeholder/500/400" 
            alt=""
            className="main-product-image"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {/* Main Image Container */}
      <div className="main-image-container">
        {/* FEATURED BADGE */}
        {isFeatured && (
          <span className="featured-badge">Featured</span>
        )}
        
        <div className="image-nav-buttons">
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage} 
                className="nav-btn prev-btn" 
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextImage} 
                className="nav-btn next-btn" 
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        <img 
          src={images[currentIndex]} 
          alt={`Product view ${currentIndex + 1}`}
          className="main-product-image"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        
        {images.length > 1 && (
          <div className="image-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="thumbnail-strip">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`thumbnail-container ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToImage(index)}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`}
                className="thumbnail-image"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};






// Product Features Component
const ProductFeatures = () => (
  <div className="product-features">
    <div className="feature-item">
      <Truck size={20} />
      <div className="feature-text">
        <strong>Free Shipping</strong>
        <span>Nationwide</span>
      </div>
    </div>
    <div className="feature-item">
      <Shield size={20} />
      <div className="feature-text">
        <strong>1 Year Warranty</strong>
        <span>Quality Guaranteed</span>
      </div>
    </div>
    <div className="feature-item">
      <RotateCcw size={20} />
      <div className="feature-text">
        <strong>7-Day Returns</strong>
        <span>Easy Returns</span>
      </div>
    </div>
    <div className="feature-item">
      <Star size={20} />
      <div className="feature-text">
        <strong>Premium Support</strong>
        <span>24/7 Help Center</span>
      </div>
    </div>
  </div>
);

// Safe clipboard utility with fallbacks
const safeCopyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
    
    throw new Error('Clipboard not available');
    
  } catch (error) {
    const copyPrompt = window.prompt(
      'Copy to clipboard: Ctrl+C, Enter', 
      text
    );
    
    return !!copyPrompt;
  }
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [copiedProductId, setCopiedProductId] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const { user } = useAuth();

  // Cleanup styles on mount/unmount to prevent style leakage
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Add page-specific class to body
    document.body.classList.add('product-detail-page');
    
    return () => {
      // Cleanup on unmount - remove all ProductDetail-specific styles
      document.body.classList.remove('product-detail-page');
      document.body.classList.remove('zoom-open');
      
      // Reset container padding for all containers
      const containers = document.querySelectorAll('.container');
      containers.forEach(container => {
        container.style.paddingBottom = '';
      });
      
      // Ensure body doesn't have overflow hidden
      document.body.style.overflow = '';
    };
  }, []);

  // Additional cleanup when location changes (navigation)
  useEffect(() => {
    return () => {
      // Ensure cleanup happens on navigation
      document.body.classList.remove('product-detail-page');
      document.body.classList.remove('zoom-open');
      const containers = document.querySelectorAll('.container');
      containers.forEach(container => {
        container.style.paddingBottom = '';
      });
      document.body.style.overflow = '';
    };
  }, [location.pathname]);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadAffiliateCode();
      if (user) {
        loadWishlist();
      }
    }
  }, [id, user]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabasePublic
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);

      const images = [];
      if (data.image_url) {
        images.push(data.image_url);
      }
      if (data.images && Array.isArray(data.images)) {
        images.push(...data.images);
      }
      setProductImages(images);

      if (data?.category) {
        const { data: related } = await supabasePublic
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .limit(4);

        setRelatedProducts(related || []);
      }

      await supabasePublic
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);

    } catch (error) {
      console.error('Error loading product:', error);
      setToast({
        message: 'Failed to load product details',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateCode = async () => {
    try {
      if (user) {
        const { data: affiliate, error } = await supabase
          .from('affiliates')
          .select('affiliate_code')
          .eq('user_id', user.id)
          .single();

        if (!error && affiliate) {
          setAffiliateCode(affiliate.affiliate_code);
        }
      }
    } catch (error) {
      console.error('Error loading affiliate code:', error);
    }
  };

  const loadWishlist = async () => {
    try {
      if (!user) {
        setWishlist([]);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)
        .limit(1000);

      if (error) {
        console.error('Wishlist error:', error);
        setWishlist([]);
        return;
      }
      
      const wishlistIds = data?.map(item => 
        typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id
      ) || [];
      
      setWishlist(wishlistIds);
    } catch (error) {
      console.error('Wishlist error:', error);
      setWishlist([]);
    }
  };

  const toggleWishlist = async () => {
    if (!product || wishlistLoading) return;
    
    setWishlistLoading(true);
    try {
      if (!user) {
        showToast('Please log in to manage your wishlist', 'error');
        navigate('/auth');
        return;
      }

      const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
      const isCurrentlyInWishlist = isInWishlist();

      if (isCurrentlyInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error && error.code !== 'PGRST116') throw error;
        
        setWishlist(prev => prev.filter(id => id !== productId));
        showToast('Removed from wishlist', 'success');
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: productId
          });

        if (error && error.code !== '23505') throw error;
        
        setWishlist(prev => [...prev, productId]);
        showToast('Added to wishlist!', 'success');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast('Error updating wishlist. Please try again.', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // FIXED: Add to Cart with proper stock validation
  const addToCart = () => {
    if (!product) return;

    // Check if product is out of stock
    if (product.stock_quantity === 0) {
      showToast('❌ This product is out of stock', 'error');
      return;
    }

    // Get current cart
    const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    // Calculate total quantity that would be in cart
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;
    
    // Check if total quantity exceeds available stock
    if (totalQuantity > product.stock_quantity) {
      const remaining = product.stock_quantity - currentCartQuantity;
      
      if (remaining <= 0) {
        showToast(`❌ You already have the maximum available quantity (${product.stock_quantity}) in your cart`, 'error');
      } else {
        showToast(`❌ Only ${remaining} more item${remaining > 1 ? 's' : ''} available. You already have ${currentCartQuantity} in cart.`, 'error');
      }
      return;
    }
    
    // Add to cart
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: productImages[0] || product.image_url,
        quantity: quantity,
        stock_quantity: product.stock_quantity
      });
    }
    
    localStorage.setItem('deetech-cart', JSON.stringify(cart));
    
    showToast(`🎉 ${quantity} ${product.name} added to cart!`, 'success');
    
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    window.dispatchEvent(new Event('storage'));
  };

  // FIXED: Add related product to cart with stock validation
  const addRelatedToCart = (relatedProduct) => {
    // Check if product is out of stock
    if (relatedProduct.stock_quantity === 0) {
      showToast('❌ This product is out of stock', 'error');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const existingItem = cart.find(item => item.id === relatedProduct.id);
    
    // Check if adding one more would exceed stock
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      
      if (newQuantity > relatedProduct.stock_quantity) {
        showToast(`❌ Maximum available quantity (${relatedProduct.stock_quantity}) already in cart`, 'error');
        return;
      }
      
      existingItem.quantity = newQuantity;
    } else {
      cart.push({
        id: relatedProduct.id,
        name: relatedProduct.name,
        price: parseFloat(relatedProduct.price),
        image_url: relatedProduct.image_url,
        quantity: 1,
        stock_quantity: relatedProduct.stock_quantity
      });
    }
    
    localStorage.setItem('deetech-cart', JSON.stringify(cart));
    
    showToast(`🎉 ${relatedProduct.name} added to cart!`, 'success');
    
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    window.dispatchEvent(new Event('storage'));
  };

  const copyProductLink = async () => {
    if (!product) return;
    
    setIsSharing(true);
    const productUrl = `${window.location.origin}/product/${product.id}`;
    
    let shareText = `🏆 ${product.name}\n💵 GH₵ ${parseFloat(product.price).toLocaleString()}\n🔗 ${productUrl}`;
    
    if (affiliateCode) {
      shareText += `\n\n🎯 Use code "${affiliateCode}" for exclusive deals!`;
    }
    
    try {
      const success = await safeCopyToClipboard(shareText);
      
      if (success) {
        setCopiedProductId(product.id);
        showToast(
          affiliateCode 
            ? '✅ Link copied with your affiliate code!' 
            : '✅ Product link copied!', 
          'success'
        );
      } else {
        showToast('📋 Please copy the link manually from the prompt', 'info');
      }
      
      setTimeout(() => {
        setCopiedProductId(null);
        setIsSharing(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('❌ Failed to copy link', 'error');
      setIsSharing(false);
    }
  };

  const shareProduct = async () => {
    if (!product) return;
    
    setIsSharing(true);
    const productUrl = `${window.location.origin}/product/${product.id}`;
    
    let shareText = `Check out this amazing product from DEETECH COMPUTERS!\n\n` +
                   `📦 ${product.name}\n` +
                   `💰 GH₵ ${parseFloat(product.price).toLocaleString()}\n` +
                   `📝 ${product.short_description || product.description?.substring(0, 120)}...\n\n` +
                   `${productUrl}`;
    
    if (affiliateCode) {
      shareText += `\n\nUse my code "${affiliateCode}" at checkout for great deals! 🚀`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - DEETECH COMPUTERS`,
          text: shareText,
          url: productUrl,
        });
        showToast('✅ Product shared successfully!', 'success');
        setIsSharing(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          const success = await safeCopyToClipboard(shareText);
          if (success) {
            showToast(
              affiliateCode 
                ? '✅ Link copied with your affiliate code!' 
                : '✅ Product link copied!', 
              'success'
            );
          } else {
            showToast('📋 Please copy the link manually', 'info');
          }
        }
        setIsSharing(false);
      }
    } else {
      const success = await safeCopyToClipboard(shareText);
      if (success) {
        showToast(
          affiliateCode 
            ? '✅ Link copied with your affiliate code!' 
            : '✅ Product link copied!', 
          'success'
        );
      } else {
        showToast('📋 Please copy the link manually from the prompt', 'info');
      }
      setIsSharing(false);
    }
  };

  // FIXED: Quantity controls with proper validation
  const increaseQuantity = () => {
    if (!product) return;
    
    // Get current cart to check existing quantity
    const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check if increasing would exceed available stock
    if (quantity + currentCartQuantity >= product.stock_quantity) {
      showToast(`❌ Maximum available quantity is ${product.stock_quantity}`, 'error');
      return;
    }
    
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  // FIXED: Handle manual quantity input with validation
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    
    if (!product) {
      setQuantity(1);
      return;
    }
    
    // Get current cart quantity
    const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    
    // Calculate max allowed quantity
    const maxAllowed = product.stock_quantity - currentCartQuantity;
    
    if (value < 1) {
      setQuantity(1);
    } else if (value > maxAllowed) {
      setQuantity(maxAllowed);
      showToast(`❌ Maximum available quantity is ${product.stock_quantity} (${currentCartQuantity} already in cart)`, 'error');
    } else {
      setQuantity(value);
    }
  };

  const isInWishlist = () => {
    if (!product) return false;
    const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
    return wishlist.includes(productId);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="error-page">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist.</p>
          <Link to="/products" className="btn">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
  <div className="container product-detail-container">
    {toast && (
      <ProductDetailToastNotification  // Make sure it's this name
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    )}

      {/* Fixed Enhanced Breadcrumb */}
      <nav className="breadcrumb">
        <button 
          onClick={() => navigate('/products')} 
          className="breadcrumb-back-btn"
        >
          <ArrowLeft size={18} />
          <span>Back to Products</span>
        </button>
        <div className="breadcrumb-links">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/products" className="breadcrumb-link">Products</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </div>
      </nav>

      {affiliateCode && (
        <div className="affiliate-notice">
          <div className="affiliate-badge">
            <Share2 size={16} />
            <span>Affiliate Mode: <strong>{affiliateCode}</strong></span>
          </div>
          <p className="affiliate-help">
            Share products and earn commissions with your unique code
          </p>
        </div>
      )}

      <div className="product-detail">
        <div className="product-images">
          {/* PASS ISFEATURED PROP TO IMAGE GALLERY */}
          <ImageGallery images={productImages} isFeatured={product?.featured} />
          
          {/* Product Features */}
          <ProductFeatures />
          
          {affiliateCode && (
            <div className="affiliate-share-section">
              <div className="share-header">
                <Share2 size={18} />
                <span>Share this product</span>
              </div>
              <div className="affiliate-share-buttons">
                <button
                  className={`share-btn copy-btn ${isSharing ? 'loading' : ''}`}
                  onClick={copyProductLink}
                  disabled={isSharing}
                  title="Copy product link with your affiliate code"
                >
                  {copiedProductId === product.id ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                  <span>
                    {copiedProductId === product.id ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>
                
                <button
                  className={`share-btn share-main-btn ${isSharing ? 'loading' : ''}`}
                  onClick={shareProduct}
                  disabled={isSharing}
                  title="Share product with your affiliate code"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
              
              {affiliateCode && (
                <div className="affiliate-code-preview">
                  <small>Your code: <code>{affiliateCode}</code> will be included</small>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="product-info-detail">
          <div className="product-header">
            <div className="title-section">
              <h1>{product.name}</h1>
            </div>
            {user && (
              <button
                className={`wishlist-btn-detail ${isInWishlist() ? 'in-wishlist' : ''} ${wishlistLoading ? 'loading' : ''}`}
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                title={isInWishlist() ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-label={isInWishlist() ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <div className="wishlist-icon-container">
                  <Heart 
                    size={22} 
                    fill={isInWishlist() ? 'currentColor' : 'none'} 
                    className="wishlist-icon"
                  />
                  {wishlistLoading && (
                    <div className="wishlist-loading-spinner">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
          
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
            <span className="product-views">{product.view_count || 0} views</span>
          </div>
          
          <div className="price-section">
            <p className="price-detail">GH₵ {parseFloat(product.price).toLocaleString()}</p>
            
            <div className="productdetail-stock-info">
              {product.stock_quantity > 0 ? (
                <span className="productdetail-stock-in">
                  <div className="productdetail-stock-indicator"></div>
                  In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="productdetail-stock-out">
                  <div className="productdetail-stock-indicator productdetail-stock-indicator-out"></div>
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions - Mobile First */}
          <div className="productdetail-quick-actions-mobile">
            <div className="productdetail-quantity-selector">
              <label className="productdetail-quantity-label">Quantity:</label>
              <div className="productdetail-quantity-controls">
                <button 
                  onClick={decreaseQuantity} 
                  className="productdetail-quantity-btn"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={product.stock_quantity}
                  className="productdetail-quantity-input"
                />
                <button 
                  onClick={increaseQuantity} 
                  className="productdetail-quantity-btn"
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </button>
              </div>
            </div>
            
            <button 
              onClick={addToCart} 
              className="productdetail-add-to-cart-btn"
              disabled={product.stock_quantity === 0}
            >
              <ShoppingCart size={20} />
              {product.stock_quantity === 0 ? 'Out of Stock' : `Add to Cart - GH₵ ${(parseFloat(product.price) * quantity).toLocaleString()}`}
            </button>
          </div>

          {/* Tabbed Content */}
          <div className="product-tabs">
            <div className="tab-headers">
              <button 
                className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button 
                className={`tab-header ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </button>
              <button 
                className={`tab-header ${activeTab === 'shipping' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping & Returns
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'description' && (
                <div className="tab-panel">
                  <p className="product-description">{product.description}</p>
                </div>
              )}
              
              {activeTab === 'specifications' && (
                <div className="tab-panel">
                  <div className="specs-list">
                    {product.specifications ? (
                      product.specifications.split(',').map((spec, index) => (
                        <div key={index} className="spec-item">
                          <span>{spec.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <p>No specifications available.</p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'shipping' && (
                <div className="tab-panel">
                  <div className="shipping-info">
                    <h4>Shipping Information</h4>
                    <ul>
                      <li>Free shipping Nationwide</li>
                      <li>24 hours delivery</li>
                      <li>Same-day delivery available for urgent orders</li>
                    </ul>
                    
                    <h4>Return Policy</h4>
                    <ul>
                      <li>7-day return policy</li>
                      <li>Items must be in original condition</li>
                      <li>Free returns for defective products</li>
                      <li>Contact support for return requests</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Quick Actions */}
          <div className="productdetail-quick-actions-desktop">
            <div className="productdetail-quantity-selector">
              <label className="productdetail-quantity-label">Quantity:</label>
              <div className="productdetail-quantity-controls">
                <button 
                  onClick={decreaseQuantity} 
                  className="productdetail-quantity-btn"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={product.stock_quantity}
                  className="productdetail-quantity-input"
                />
                <button 
                  onClick={increaseQuantity} 
                  className="productdetail-quantity-btn"
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </button>
              </div>
            </div>
            
            <button 
              onClick={addToCart} 
              className="productdetail-add-to-cart-btn"
              disabled={product.stock_quantity === 0}
            >
              <ShoppingCart size={20} />
              {product.stock_quantity === 0 ? 'Out of Stock' : `Add to Cart - GH₵ ${(parseFloat(product.price) * quantity).toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Related Products - GRID LAYOUT */}
      {relatedProducts.length > 0 && (
        <section className="related-products">
          <div className="section-header">
            <h2>Related Products</h2>
            <Link to="/products" className="view-all-link">
              View All Products →
            </Link>
          </div>
          <div className="related-products-grid">
            {relatedProducts.map(relatedProduct => (
              <div key={relatedProduct.id} className="product-card">
                <div className="product-image-container">
                  <img 
                    src={relatedProduct.image_url || '/api/placeholder/300/200'} 
                    alt={relatedProduct.name}
                    className="product-image"
                    loading="lazy"
                  />
                  {relatedProduct.featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-title">{relatedProduct.name}</h3>
                  <p className="product-specs">
                    {relatedProduct.short_description || 
                     (relatedProduct.description?.substring(0, 100) + '...') || 
                     'No description available'}
                  </p>
                  <p className="product-price">
                    GH₵ {parseFloat(relatedProduct.price).toLocaleString()}
                  </p>
                  <div className="product-actions">
                    <button 
                      className="btn btn-small"
                      onClick={() => addRelatedToCart(relatedProduct)}
                      disabled={relatedProduct.stock_quantity === 0}
                    >
                      {relatedProduct.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <Link 
                      to={`/product/${relatedProduct.id}`}
                      className="btn btn-small btn-secondary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
