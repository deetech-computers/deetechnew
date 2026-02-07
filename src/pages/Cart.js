import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { supabasePublic as supabase } from '../config/supabase';
import '../App.css';
import '../styles/cart.css';

// Cart Toast Notification Component
const CartToastNotification = ({ message, type = 'success', onClose }) => {
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
      default: return '✓';
    }
  };

  return (
    <div className={`cart-toast-notification cart-toast-${type} ${isExiting ? 'cart-toast-exiting' : ''}`}>
      <div className="cart-toast-content">
        <div className="cart-toast-icon">
          {getToastIcon()}
        </div>
        <span className="cart-toast-message">{message}</span>
        <button onClick={handleClose} className="cart-toast-close">
          ×
        </button>
      </div>
      <div className="cart-toast-progress"></div>
    </div>
  );
};


const Cart = () => {
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState({});
  const [refreshingStock, setRefreshingStock] = useState(false);
  const [needsStockCheck, setNeedsStockCheck] = useState(false);
  const navigate = useNavigate();
  
  // Use refs to track subscriptions and avoid stale closures
  const subscriptionRef = useRef(null);
  const isMountedRef = useRef(true);
  const cartRef = useRef(cart);
  const stockInfoRef = useRef(stockInfo);

  // Keep refs updated with current state
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    stockInfoRef.current = stockInfo;
  }, [stockInfo]);

  // Cart operations
  const loadCart = useCallback(() => {
    const cartData = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    setCart(cartData);
  }, []);

  const removeFromCart = useCallback((productId) => {
    const currentCart = cartRef.current;
    const product = currentCart.find(item => item.id === productId);
    const updatedCart = currentCart.filter(item => item.id !== productId);
    
    setCart(updatedCart);
    localStorage.setItem('deetech-cart', JSON.stringify(updatedCart));
    
    // Show removal notification
    setToast({
      message: `"${product?.name || 'Item'}" removed from cart`,
      type: 'info'
    });
    
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.setItem('deetech-cart', JSON.stringify([]));
    setToast({
      message: 'Cart cleared',
      type: 'info'
    });
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }, []);

  // Product availability check with automatic quantity adjustment
  const checkProductAvailability = useCallback((products, currentCart) => {
    const unavailableProducts = [];
    const updatedCart = [...currentCart];
    let cartWasUpdated = false;

    currentCart.forEach((cartItem, index) => {
      const product = products.find(p => p.id === cartItem.id);
      
      if (!product) {
        // Product no longer exists in database
        unavailableProducts.push(`${cartItem.name} (removed - product not found)`);
        updatedCart.splice(index, 1);
        cartWasUpdated = true;
      } else if (!product.is_active) {
        // Product is inactive
        unavailableProducts.push(`${cartItem.name} (removed - product inactive)`);
        updatedCart.splice(index, 1);
        cartWasUpdated = true;
      } else if (product.stock_quantity === 0) {
        // Product is out of stock - remove from cart
        unavailableProducts.push(`${cartItem.name} (removed - out of stock)`);
        updatedCart.splice(index, 1);
        cartWasUpdated = true;
      } else if (cartItem.quantity > product.stock_quantity) {
        // AUTOMATICALLY ADJUST quantity to available stock
        const oldQuantity = cartItem.quantity;
        updatedCart[index] = {
          ...cartItem,
          quantity: product.stock_quantity
        };
        unavailableProducts.push(`${cartItem.name}: Quantity reduced from ${oldQuantity} to ${product.stock_quantity} (limited stock)`);
        cartWasUpdated = true;
      }
    });

    // Update cart if any changes were made
    if (cartWasUpdated) {
      setCart(updatedCart);
      localStorage.setItem('deetech-cart', JSON.stringify(updatedCart));
      
      // Show notification about changes
      if (unavailableProducts.length > 0) {
        setToast({
          message: `Cart updated: ${unavailableProducts.join(', ')}`,
          type: 'warning'
        });
      }

      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      return true; // Indicates cart was updated
    }
    return false; // No changes made
  }, []);

  // Helper function to validate and fix cart quantities
  const validateAndFixCartQuantities = useCallback(() => {
    const currentCart = cartRef.current;
    const currentStockInfo = stockInfoRef.current;
    
    if (currentCart.length === 0 || Object.keys(currentStockInfo).length === 0) return;

    const updatedCart = [...currentCart];
    const fixes = [];
    let cartWasUpdated = false;

    updatedCart.forEach((item, index) => {
      const availableStock = currentStockInfo[item.id]?.stock_quantity;
      const productName = currentStockInfo[item.id]?.name;
      const isActive = currentStockInfo[item.id]?.is_active;

      if (!isActive) {
        // Product is inactive
        updatedCart.splice(index, 1);
        fixes.push(`${productName} (removed - product inactive)`);
        cartWasUpdated = true;
      } else if (availableStock === 0) {
        // Product is out of stock
        updatedCart.splice(index, 1);
        fixes.push(`${productName} (removed - out of stock)`);
        cartWasUpdated = true;
      } else if (availableStock !== undefined && item.quantity > availableStock) {
        // AUTOMATICALLY ADJUST quantity to available stock
        const oldQuantity = item.quantity;
        updatedCart[index] = {
          ...item,
          quantity: availableStock
        };
        fixes.push(`${productName}: Quantity adjusted from ${oldQuantity} to ${availableStock}`);
        cartWasUpdated = true;
      }
    });

    // If fixes were made, update cart and show toast
    if (cartWasUpdated && isMountedRef.current) {
      setCart(updatedCart);
      localStorage.setItem('deetech-cart', JSON.stringify(updatedCart));
      
      if (fixes.length > 0) {
        setToast({
          message: `Cart adjusted: ${fixes.join(', ')}`,
          type: 'warning'
        });
      }

      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  }, []);

  // Load stock information
  const loadStockInfo = useCallback(async (shouldCheckAvailability = false) => {
    if (!isMountedRef.current) return;
    
    try {
      const currentCart = cartRef.current;
      const productIds = currentCart.map(item => item.id);
      
      if (productIds.length === 0) return;

      const { data: products, error } = await supabase
        .from('products')
        .select('id, stock_quantity, name, is_active, low_stock_threshold')
        .in('id', productIds);

      if (error) throw error;

      const stockData = {};
      products.forEach(product => {
        stockData[product.id] = {
          stock_quantity: product.stock_quantity,
          name: product.name,
          is_active: product.is_active,
          low_stock_threshold: product.low_stock_threshold || 5
        };
      });

      if (isMountedRef.current) {
        setStockInfo(stockData);

        // Trigger automatic cart validation after loading stock info
        setTimeout(() => {
          validateAndFixCartQuantities();
        }, 100);

        // Check availability when requested
        if (shouldCheckAvailability) {
          checkProductAvailability(products, currentCart);
        }
      }
    } catch (error) {
      console.error('Error loading stock info:', error);
      if (isMountedRef.current) {
        setToast({
          message: 'Error loading product information',
          type: 'error'
        });
      }
    }
  }, [checkProductAvailability, validateAndFixCartQuantities]);

  const refreshStockInfo = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setRefreshingStock(true);
    try {
      // Force a full stock check and cart validation
      await loadStockInfo(true);
      
      // Extra validation after load
      setTimeout(() => {
        validateAndFixCartQuantities();
      }, 200);
      
      if (isMountedRef.current) {
        setToast({
          message: 'Stock information updated and cart validated',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error refreshing stock info:', error);
    } finally {
      if (isMountedRef.current) {
        setRefreshingStock(false);
      }
    }
  }, [loadStockInfo, validateAndFixCartQuantities]);

  // Memoized helper functions
  const getAvailableStock = useCallback((productId) => {
    return stockInfo[productId]?.stock_quantity || 0;
  }, [stockInfo]);

  const isLowStock = useCallback((productId, quantity) => {
    const availableStock = getAvailableStock(productId);
    const lowStockThreshold = stockInfo[productId]?.low_stock_threshold || 5;
    return availableStock > 0 && availableStock <= lowStockThreshold;
  }, [getAvailableStock, stockInfo]);

  const isOutOfStock = useCallback((productId) => {
    const availableStock = getAvailableStock(productId);
    return availableStock === 0;
  }, [getAvailableStock]);

  const isInactive = useCallback((productId) => {
    return stockInfo[productId]?.is_active === false;
  }, [stockInfo]);

  const hasCartIssues = useCallback(() => {
    return cart.some(item => 
      isOutOfStock(item.id) || 
      isInactive(item.id) || 
      isLowStock(item.id, item.quantity)
    );
  }, [cart, isOutOfStock, isInactive, isLowStock]);

  // UPDATED: updateQuantity function with automatic adjustment
  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const currentCart = cartRef.current;
    const currentStockInfo = stockInfoRef.current;
    
    // Check stock before updating quantity
    const productStock = currentStockInfo[productId]?.stock_quantity;
    const productName = currentStockInfo[productId]?.name;

    // If stock info is not loaded yet
    if (productStock === undefined) {
      setToast({
        message: `Loading product information...`,
        type: 'info'
      });
      await loadStockInfo(true);
      return;
    }

    // AUTOMATICALLY ADJUST if user tries to add more than available
    if (newQuantity > productStock) {
      const adjustedQuantity = productStock;
      
      // Show immediate toast about adjustment
      setToast({
        message: `Only ${productStock} units available for "${productName}". Adjusted to ${adjustedQuantity}.`,
        type: 'warning'
      });

      // Update cart with adjusted quantity
      const updatedCart = currentCart.map(item =>
        item.id === productId ? { ...item, quantity: adjustedQuantity } : item
      );
      
      setCart(updatedCart);
      localStorage.setItem('deetech-cart', JSON.stringify(updatedCart));
      
      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      return;
    }

    // Normal quantity update
    const updatedCart = currentCart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('deetech-cart', JSON.stringify(updatedCart));
    
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cartUpdated'));

    // Show success message for quantity update
    setToast({
      message: `Quantity updated for "${productName}"`,
      type: 'success'
    });
  }, [loadStockInfo, removeFromCart]);

  // Checkout process
  const proceedToCheckout = useCallback(async () => {
    const currentCart = cartRef.current;
    
    if (currentCart.length === 0) {
      setToast({
        message: 'Your cart is empty',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Final stock verification before checkout
      const productIds = currentCart.map(item => item.id);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, stock_quantity, name, is_active')
        .in('id', productIds);

      if (error) throw error;

      const outOfStockItems = [];
      const inactiveItems = [];
      const insufficientStockItems = [];
      const verifiedCart = [];

      currentCart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        
        if (!product) {
          outOfStockItems.push(cartItem.name);
        } else if (!product.is_active) {
          inactiveItems.push(cartItem.name);
        } else if (product.stock_quantity < cartItem.quantity) {
          // AUTOMATICALLY ADJUST for checkout as well
          const adjustedQuantity = product.stock_quantity;
          verifiedCart.push({
            ...cartItem,
            quantity: adjustedQuantity
          });
          insufficientStockItems.push({
            name: product.name,
            oldQuantity: cartItem.quantity,
            newQuantity: adjustedQuantity
          });
        } else {
          verifiedCart.push(cartItem);
        }
      });

      // Handle unavailable items
      if (outOfStockItems.length > 0 || inactiveItems.length > 0) {
        const unavailableItems = [...outOfStockItems, ...inactiveItems];
        setToast({
          message: `Some items are no longer available: ${unavailableItems.join(', ')}`,
          type: 'error'
        });
        
        // Update cart with only available items
        setCart(verifiedCart);
        localStorage.setItem('deetech-cart', JSON.stringify(verifiedCart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        setLoading(false);
        return;
      }

      // Handle adjusted items
      if (insufficientStockItems.length > 0) {
        const message = insufficientStockItems.map(item => 
          `"${item.name}" adjusted from ${item.oldQuantity} to ${item.newQuantity} units`
        ).join('; ');
        
        // Update cart with adjusted quantities
        setCart(verifiedCart);
        localStorage.setItem('deetech-cart', JSON.stringify(verifiedCart));
        
        setToast({
          message: `Quantities adjusted: ${message}. Please review your cart.`,
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      // All checks passed, proceed to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error verifying stock:', error);
      setToast({
        message: 'Error verifying product availability. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Event handlers
  const handleProductClick = useCallback((productId, productSlug) => {
    const productPath = productSlug ? `/product/${productSlug}` : `/product/${productId}`;
    navigate(productPath);
  }, [navigate]);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Calculations
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Setup and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    loadCart();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      if (isMountedRef.current) {
        loadCart();
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('cartUpdated', handleCartUpdate);
      
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [loadCart]);

  // Set up real-time subscription for stock changes
  useEffect(() => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Only subscribe if cart has items
    if (cart.length > 0 && isMountedRef.current) {
      const subscription = supabase
        .channel('cart-stock-monitoring')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'products'
          }, 
          (payload) => {
            if (isMountedRef.current) {
              console.log('Real-time stock update detected:', payload);
              setNeedsStockCheck(true);
            }
          }
        )
        .subscribe();

      subscriptionRef.current = subscription;
    }

    return () => {
      // Cleanup on unmount or when cart changes
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [cart.length]); // Only re-run when cart length changes

  // Load stock info when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      loadStockInfo(false);
    } else {
      setStockInfo({});
    }
  }, [cart, loadStockInfo]);

  // Handle stock check when needed (from real-time updates)
  useEffect(() => {
    if (needsStockCheck && cart.length > 0 && isMountedRef.current) {
      loadStockInfo(true);
      setNeedsStockCheck(false);
    }
  }, [needsStockCheck, cart.length, loadStockInfo]);

  // Validate cart whenever stock info changes
  useEffect(() => {
    if (Object.keys(stockInfo).length > 0 && cart.length > 0 && isMountedRef.current) {
      const timeoutId = setTimeout(() => {
        validateAndFixCartQuantities();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [stockInfo, cart.length, validateAndFixCartQuantities]);

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        {toast && (
          <CartToastNotification 
            message={toast.message} 
            type={toast.type} 
            onClose={closeToast} 
          />



        )}
        <div className="cart-empty-cart">
          <ShoppingBag size={64} />
          <h2>Your Cart is Empty</h2>
          <p>Add some products to your cart to get started.</p>
          <Link to="/products" className="cart-continue-shopping cart-btn-large">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {toast && (
        <CartToastNotification 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
      
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <div className="cart-actions">
          <button 
            onClick={refreshStockInfo}
            className="cart-refresh-btn cart-btn-secondary cart-btn-small"
            disabled={refreshingStock}
            title="Refresh stock information"
          >
            <RefreshCw size={16} className={refreshingStock ? 'cart-spinning' : ''} />
            {refreshingStock ? 'Refreshing...' : 'Refresh Stock'}
          </button>
          <button 
            onClick={clearCart}
            className="cart-clear-btn cart-btn-danger cart-btn-small"
            title="Clear entire cart"
          >
            <Trash2 size={16} />
            Clear Cart
          </button>
        </div>
      </div>
      
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item, index) => {
            const availableStock = getAvailableStock(item.id);
            const outOfStock = isOutOfStock(item.id);
            const inactive = isInactive(item.id);
            const lowStock = isLowStock(item.id, item.quantity);
            const maxReached = item.quantity >= availableStock;

            return (
              <div 
                key={`${item.id}-${index}-${item.quantity}`} 
                className={`cart-item ${outOfStock || inactive ? 'cart-unavailable' : ''}`}
              >
                {/* Clickable Product Image */}
                <div 
                  className="cart-item-image cart-clickable"
                  onClick={() => handleProductClick(item.id, item.slug)}
                  title={`View ${item.name} details`}
                >
                  <img 
                    src={item.image_url || '/api/placeholder/100/100'} 
                    alt={item.name}
                  />
                  {(outOfStock || inactive) && (
                    <div className="cart-stock-badge cart-unavailable-badge">
                      <AlertCircle size={16} />
                      {inactive ? 'Not Available' : 'Out of Stock'}
                    </div>
                  )}
                </div>
                
                {/* Clickable Product Details */}
                <div 
                  className="cart-item-details cart-clickable"
                  onClick={() => handleProductClick(item.id, item.slug)}
                  title={`View ${item.name} details`}
                >
                  <h3>{item.name}</h3>
                  <p className="cart-item-category">{item.category}</p>
                  <p className="cart-item-price">GH₵ {item.price.toFixed(2)}</p>
                  
                  {/* Stock Information */}
                  <div className="cart-stock-info">
                    {inactive ? (
                      <span className="cart-stock-status cart-unavailable">
                        <AlertCircle size={14} />
                        Product no longer available
                      </span>
                    ) : outOfStock ? (
                      <span className="cart-stock-status cart-out-of-stock">
                        <AlertCircle size={14} />
                        Out of Stock
                      </span>
                    ) : lowStock ? (
                      <span className="cart-stock-status cart-low-stock">
                        <AlertCircle size={14} />
                        Only {availableStock} left in stock
                      </span>
                    ) : (
                      <span className="cart-stock-status cart-in-stock">
                        {availableStock} in stock
                        {maxReached && (
                          <span className="cart-max-indicator"> (Max available)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {item.short_description && (
                    <p className="cart-item-description">{item.short_description}</p>
                  )}
                </div>
                
                {/* Quantity Controls */}
                <div className="cart-item-controls">
                  <div className="cart-quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="cart-quantity-btn cart-quantity-decrease"
                      aria-label={`Decrease quantity of ${item.name}`}
                      disabled={outOfStock || inactive || item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="cart-quantity-display">
                      {item.quantity}
                      {maxReached && (
                        <span className="cart-max-reached-indicator" title="Maximum available quantity">
                          (max)
                        </span>
                      )}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="cart-quantity-btn cart-quantity-increase"
                      aria-label={`Increase quantity of ${item.name}`}
                      disabled={outOfStock || inactive || maxReached}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {/* Item Total */}
                  <div className="cart-item-total">
                    GH₵ {(item.price * item.quantity).toFixed(2)}
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="cart-remove-btn"
                    title={`Remove ${item.name} from cart`}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="cart-summary">
          <h3>Order Summary</h3>
          
          <div className="cart-summary-row">
            <span>Items ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}):</span>
            <span>GH₵ {getTotalPrice().toFixed(2)}</span>
          </div>
          
          <div className="cart-summary-row">
            <span>Delivery:</span>
            <span className="cart-free-delivery">FREE</span>
          </div>
          
          <div className="cart-summary-row cart-total">
            <span>Total:</span>
            <span>GH₵ {getTotalPrice().toFixed(2)}</span>
          </div>

          {/* Stock Warning */}
          {hasCartIssues() && (
            <div className="cart-stock-warning">
              <AlertCircle size={16} />
              <span>
                {cart.some(item => isOutOfStock(item.id) || isInactive(item.id)) 
                  ? 'Remove unavailable items to checkout' 
                  : 'Some items have limited stock. Complete your purchase soon.'
                }
              </span>
            </div>
          )}
          
          <button 
            onClick={proceedToCheckout} 
            className="cart-checkout-btn cart-btn-large"
            disabled={loading || cart.some(item => isOutOfStock(item.id) || isInactive(item.id))}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="cart-spinning" />
                Checking Stock...
              </>
            ) : (
              'Proceed to Checkout'
            )}
          </button>
          
          {cart.some(item => isOutOfStock(item.id) || isInactive(item.id)) && (
            <div className="cart-checkout-disabled-message">
              Remove unavailable items to proceed with checkout
            </div>
          )}
          
          <Link to="/products" className="cart-continue-shopping-link">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
