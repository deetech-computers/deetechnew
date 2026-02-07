import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, User, Search, Heart, Menu, X } from 'lucide-react';
import DarkModeToggle from '../DarkModeToggle';

import '../../styles/navbar.css';

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { user, signOut, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchOverlayRef = useRef(null);

  const isProductsPage = location.pathname === '/products';

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update cart and wishlist counts
  useEffect(() => {
    const updateCounts = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
        const wishlist = JSON.parse(localStorage.getItem('deetech-wishlist')) || [];
        setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
        setWishlistCount(wishlist.length);
      } catch (error) {
        console.error('Error updating counts:', error);
        setCartCount(0);
        setWishlistCount(0);
      }
    };

    updateCounts();
    
    // Listen for updates
    window.addEventListener('storage', updateCounts);
    window.addEventListener('cartUpdated', updateCounts);
    window.addEventListener('wishlistUpdated', updateCounts);
    
    return () => {
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('cartUpdated', updateCounts);
      window.removeEventListener('wishlistUpdated', updateCounts);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.mobile-hamburger')) {
        setIsMobileMenuOpen(false);
      }
      if (isSearchActive && searchOverlayRef.current && 
          !searchOverlayRef.current.contains(event.target) &&
          !event.target.closest('.search-toggle') &&
          !event.target.closest('.mobile-search-icon')) {
        deactivateSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchActive]);

  // Focus search input when activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Close search when pressing Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isSearchActive) {
        deactivateSearch();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isSearchActive]);

  // Sync search query with URL when on products page
  useEffect(() => {
    if (isProductsPage) {
      const urlParams = new URLSearchParams(location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, [location.search, isProductsPage]);

  // Handle body scroll locking
  useEffect(() => {
    if (isSearchActive || isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchActive, isMobileMenuOpen]);

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    
    try {
      const result = await signOut();
      
      if (result.success) {
        // Force immediate UI update
        console.log('✅ Signed out successfully');
        
        // Clear any cached data
        sessionStorage.clear();
        
        // Navigate to home page
        navigate('/', { replace: true });
        
        // Optional: Show toast notification if you have it
        // showToast('Signed out successfully', 'success');
      } else {
        console.error('Sign out failed:', result.error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const activateSearch = () => {
    if (isProductsPage) return;
    setIsSearchActive(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const deactivateSearch = () => {
    setIsSearchActive(false);
    if (!isProductsPage) {
      setSearchQuery('');
    }
  };

  const handleSearch = (e) => {
    if (isProductsPage) return;
    
    if ((e.type === 'click' || e.key === 'Enter') && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      deactivateSearch();
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/about', label: 'About' },
    { path: '/support', label: 'Support' },
    { path: '/affiliates', label: 'Affiliates' }
  ];

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo">
            <Link to="/" className="logo-link">
              <img 
                src="/deetech-logo.png" 
                alt="DeeTech Computers" 
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="logo-fallback" style={{display: 'none'}}>
                <span className="logo-text">DEETECH</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <ul className="nav-menu">
            {navLinks.map((link) => (
              <li key={link.path} className="nav-item">
                <Link 
                  to={link.path} 
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Icons */}
          <div className="nav-icons">
            {/* Dark Mode Toggle */}
            <div className="dark-mode-toggle-wrapper">
              <DarkModeToggle />
            </div>

            {/* Search - Hidden on products page */}
            {!isProductsPage && (
              <button 
                className="nav-icon search-toggle desktop-only"
                onClick={activateSearch}
                aria-label="Search products"
              >
                <Search size={20} />
              </button>
            )}

            {/* Wishlist */}
            <Link 
              to={user ? "/account?tab=wishlist" : "/wishlist"}
              className="nav-icon wishlist-link"
              onClick={(e) => {
                if (user) {
                  e.preventDefault();
                  navigate('/account?tab=wishlist');
                }
              }}
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {wishlistCount > 0 && <span className="icon-badge">{wishlistCount}</span>}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="nav-icon cart-link" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
            </Link>

            {/* User Account */}
            {user ? (
              <div className="user-dropdown" ref={dropdownRef}>
                <button 
                  className="nav-icon user-toggle" 
                  onClick={toggleDropdown}
                  aria-label="User menu"
                >
                  <User size={20} />
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-user-info">
                      <span className="dropdown-email">{user.email}</span>
                    </div>
                    <Link to="/account" className="dropdown-item">
                      My Account
                    </Link>
                    {isAdmin && isAdmin() && (
                      <Link to="/admin" className="dropdown-item">
                        Admin Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={handleSignOut} 
                      className="dropdown-item logout"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nav-icon account-link" aria-label="Login">
                <User size={20} />
              </Link>
            )}
          </div>

          {/* Mobile Icons */}
          <div className="mobile-nav-icons">
            {/* Dark Mode Toggle for Mobile */}
            <div className="mobile-dark-mode-toggle">
              <DarkModeToggle />
            </div>

            {/* Mobile Search Icon */}
            {!isProductsPage && (
              <button 
                className="mobile-search-icon"
                onClick={activateSearch}
                aria-label="Search products"
              >
                <Search size={22} />
              </button>
            )}
            
            {/* Mobile Hamburger */}
            <button 
              className="mobile-hamburger"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {!isProductsPage && (
          <div 
            ref={searchOverlayRef}
            className={`search-overlay ${isSearchActive ? 'active' : ''}`}
          >
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search all products by name, brand, category..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchInputKeyDown}
                />
                <button 
                  className="search-close"
                  onClick={deactivateSearch}
                  aria-label="Close search"
                >
                  ×
                </button>
              </div>
              <button 
                className="search-submit"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                <Search size={20} />
                <span className="search-text">Search Products</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content" ref={mobileMenuRef}>
          <div className="mobile-menu-header">
            <div className="mobile-user-section">
              {user ? (
                <div className="mobile-user-info">
                  <User size={20} />
                  <span>{user.email}</span>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="mobile-login-btn" 
                  onClick={toggleMobileMenu}
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>

          <div className="mobile-menu-items">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Cart */}
            <Link 
              to="/cart" 
              className="mobile-menu-item cart" 
              onClick={toggleMobileMenu}
            >
              Shopping Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            
            {/* Wishlist */}
            <Link 
              to={user ? "/account?tab=wishlist" : "/wishlist"}
              className="mobile-menu-item wishlist"
              onClick={(e) => {
                if (user) {
                  e.preventDefault();
                  navigate('/account?tab=wishlist');
                }
                toggleMobileMenu();
              }}
            >
              Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>

            {/* User Menu Items */}
            {user && (
              <>
                <Link 
                  to="/account" 
                  className="mobile-menu-item" 
                  onClick={toggleMobileMenu}
                >
                  My Account
                </Link>
                {isAdmin && isAdmin() && (
                  <Link 
                    to="/admin" 
                    className="mobile-menu-item" 
                    onClick={toggleMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button 
                  onClick={handleSignOut}
                  className="mobile-menu-item logout"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;