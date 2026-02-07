import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../App.css';
import '../../styles/mobile-bottom-nav.css';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, authInitialized } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  const isActive = (path) => location.pathname === path;

  // Load cart items count from localStorage
  useEffect(() => {
    const loadCartCount = () => {
      try {
        const cartData = JSON.parse(localStorage.getItem('deetech-cart')) || [];
        const totalItems = cartData.reduce((total, item) => total + (item.quantity || 0), 0);
        setCartItemCount(totalItems);
      } catch (error) {
        console.error('Error loading cart count:', error);
        setCartItemCount(0);
      }
    };

    // Load initial cart count
    loadCartCount();

    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      loadCartCount();
    };

    // Add event listeners for cart updates
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // Update account path when user state changes
  const accountPath = user ? '/account' : '/login';

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Home',
      isAccountItem: false
    },
    { 
      path: '/products', 
      icon: Package, 
      label: 'Products',
      isAccountItem: false
    },
    { 
      path: '/cart', 
      icon: ShoppingCart, 
      label: 'Cart',
      showBadge: true,
      badgeCount: cartItemCount,
      isAccountItem: false
    },
    { 
      path: accountPath, 
      icon: User, 
      label: user ? 'Account' : 'Login',
      isAccountItem: true
    }
  ];

  return (
    <nav className="mobileBottomNav">
      {navItems.map((item) => {
        const Icon = item.icon;
        // For account item, check if we're on /account OR /login
        const active = item.isAccountItem 
          ? (location.pathname === '/account' || location.pathname === '/login')
          : isActive(item.path);
        
        return (
          <Link
            key={item.isAccountItem ? 'account-nav-item' : item.path}
            to={item.path}
            className={`item ${active ? 'itemActive' : ''}`}
          >
            <div className="navIconContainer">
              <Icon className="icon" size={20} />
              {item.showBadge && cartItemCount > 0 && (
                <span 
                  className="cartBadge" 
                  data-count={cartItemCount}
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </div>
            <span className="label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;