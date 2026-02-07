import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, ChevronUp, Facebook, MessageSquare, Music2 } from 'lucide-react';
import PropTypes from 'prop-types';
import '../../App.css';
import '../../styles/footer.css';

// Constants extracted for better organization
const FOOTER_DATA = {
  company: {
    name: "DEETECH COMPUTERS",
    description: "Your trusted partner for quality laptops, phones, and accessories in Ghana. Providing cutting-edge technology solutions with exceptional customer service.",
    email: "deetechcomputers01@gmail.com",
    location: "Kumasi, Ghana",
    hours: {
      weekdays: "Mon - Sat: 8:00 AM - 6:00 PM",
      sunday: "Sunday: 10:00 AM - 4:00 PM"
    }
  },
  phoneNumbers: [
    { number: '+233591755964', display: '+233 591 755 964' },
    { number: '+233509673406', display: '+233 509 673 406' }
  ],
  shopCategories: [
    { label: 'All Products', query: '' },
    { label: 'Laptops', query: '?category=laptops' },
    { label: 'Smartphones', query: '?category=phones' },
    { label: 'Accessories', query: '?category=accessories' },
    { label: 'Monitors', query: '?category=monitors' },
    { label: 'Printers', query: '?category=printers' }
  ],
  supportLinks: [
    { path: '/warranty', label: 'Warranty Policy' },
    { path: '/delivery-policy', label: 'Delivery Policy' },
    { path: '/return-refund-policy', label: 'Returns & Refunds' },
    { path: '/payment-policy', label: 'Payment Options' },
    { path: '/faq', label: 'FAQ & Help Center' },
    { path: '/support', label: 'Contact Support' }
  ],
  paymentMethods: [
    'Hubtel',
    'MTN Mobile Money', 
    'Telecel Cash',
    'Bank Transfer',
    'Cash on Delivery'
  ],
  socialLinks: [
    {
      icon: MessageSquare,
      url: 'https://whatsapp.com/channel/0029VavCp7HInlqHhP0aGf3z',
      label: 'Join our WhatsApp Channel',
      title: 'WhatsApp Channel',
      className: 'whatsapp-channel'
    },
    {
      icon: Facebook,
      url: 'https://www.facebook.com/share/1J6Xpy9KcB/?mibextid=wwXIfr',
      label: 'Follow us on Facebook',
      title: 'Facebook',
      className: 'facebook'
    },
    {
      icon: Music2, // Changed from Music to Music2 for proper TikTok icon
      url: 'https://www.tiktok.com/@deetech.computers?_r=1&_t=ZM-931koVYiI2K',
      label: 'Follow us on TikTok',
      title: 'TikTok',
      className: 'tiktok'
    }
  ],
  legalLinks: [
    { path: '/privacy-policy', label: 'Privacy Policy' },
    { path: '/terms-of-use', label: 'Terms of Use' }
  ]
};

// Reusable components
const SocialLinks = ({ links, size = 18, onSocialClick }) => (
  <div className="social-links">
    {links.map(({ icon: Icon, url, label, title, className }) => (
      <button
        key={label}
        className={`social-link ${className}`}
        onClick={() => onSocialClick(url)}
        aria-label={label}
        title={title}
        type="button"
      >
        <Icon size={size} aria-hidden="true" />
        <span>{title}</span>
      </button>
    ))}
  </div>
);

const ContactItem = ({ 
  icon: Icon, 
  text, 
  onClick, 
  isClickable = false, 
  children, 
  onKeyPress,
  ariaLabel 
}) => (
  <div 
    className={`contact-item ${isClickable ? 'clickable' : ''}`}
    onClick={isClickable ? onClick : undefined}
    onKeyDown={isClickable ? (e) => onKeyPress(e, onClick) : undefined}
    tabIndex={isClickable ? 0 : -1}
    role={isClickable ? 'button' : 'presentation'}
    aria-label={ariaLabel}
  >
    <Icon size={16} aria-hidden="true" />
    <span>{text}</span>
    {children}
  </div>
);

const FooterSection = ({ title, children, ariaLabel }) => (
  <div className="footer-section">
    <h3 className="footer-subtitle">{title}</h3>
    {ariaLabel ? (
      <nav aria-label={ariaLabel}>
        {children}
      </nav>
    ) : (
      children
    )}
  </div>
);

const Footer = () => {
  const footerRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Memoized data for better performance
  const { 
    company, 
    phoneNumbers, 
    shopCategories, 
    supportLinks, 
    paymentMethods, 
    socialLinks,
    legalLinks 
  } = useMemo(() => FOOTER_DATA, []);

  // Reusable utility functions
  const safeWindowOpen = useCallback((url) => {
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (newWindow) newWindow.opener = null;
      return newWindow;
    } catch (error) {
      console.error('Failed to open window:', error);
      return null;
    }
  }, []);

  // Memoized height calculation with error handling
  const updateFooterHeight = useCallback(() => {
    try {
      const footer = footerRef.current;
      if (footer && typeof document !== 'undefined') {
        const footerHeight = footer.offsetHeight;
        document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
      }
    } catch (error) {
      console.warn('Failed to update footer height:', error);
    }
  }, []);

  // Scroll handler for back to top button
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    setShowBackToTop(scrollPosition > 500);
  }, []);

  // Fixed useEffect - removed duplicate event listener
  useEffect(() => {
    updateFooterHeight();
    
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateFooterHeight, 150);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      handleScroll();
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(resizeTimeout);
      };
    }
  }, [updateFooterHeight, handleScroll]);

  // Contact handlers
  const handleEmailClick = useCallback(() => {
    try {
      window.location.href = `mailto:${company.email}`;
    } catch (error) {
      console.error('Failed to open email client:', error);
    }
  }, [company.email]);

  const handleWhatsAppClick = useCallback((phoneNumber) => {
    try {
      const message = "Hello DEETECH COMPUTERS! I'm interested in your products and would like more information.";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      safeWindowOpen(whatsappUrl);
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
    }
  }, [safeWindowOpen]);

  const handlePhoneClick = useCallback((phoneNumber) => {
    try {
      window.location.href = `tel:${phoneNumber}`;
    } catch (error) {
      console.error('Failed to initiate phone call:', error);
    }
  }, []);

  // Social media handler
  const handleSocialClick = useCallback((url) => {
    safeWindowOpen(url);
  }, [safeWindowOpen]);

  // Back to top handler
  const handleBackToTop = useCallback(() => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('Failed to scroll to top:', error);
      window.scrollTo(0, 0);
    }
  }, []);

  // Keyboard support
  const handleKeyPress = useCallback((e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  // Prevent click conflicts
  const handleContactClick = useCallback((event, action) => {
    if (event.target.closest('.whatsapp-btn')) {
      return;
    }
    action();
  }, []);

  // Current year for copyright
  const currentYear = new Date().getFullYear();

  // Render functions for repeated patterns
  const renderShopLinks = () => (
    <ul className="footer-links">
      {shopCategories.map(({ label, query }) => (
        <li key={label}>
          <Link 
            to={`/products${query}`}
            aria-label={`Browse ${label}`}
            className="footer-link"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const renderSupportLinks = () => (
    <ul className="footer-links">
      {supportLinks.map(({ path, label }) => (
        <li key={path}>
          <Link 
            to={path} 
            aria-label={label}
            className="footer-link"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const renderContactItems = () => (
    <div className="contact-info">
      <ContactItem
        icon={Mail}
        text={company.email}
        onClick={handleEmailClick}
        isClickable
        onKeyPress={handleKeyPress}
        ariaLabel={`Send email to ${company.name}`}
      />
      
      {phoneNumbers.map(({ number, display }) => (
        <div 
          key={number}
          className="contact-item clickable"
          onClick={(e) => handleContactClick(e, () => handlePhoneClick(number))}
          onKeyDown={(e) => handleKeyPress(e, () => handlePhoneClick(number))}
          tabIndex={0}
          role="button"
          aria-label={`Call ${display}`}
        >
          <Phone size={16} aria-hidden="true" />
          <span>{display}</span>
          <button 
            className="whatsapp-btn"
            onClick={() => handleWhatsAppClick(number.replace('+', ''))}
            aria-label={`Chat with ${display} on WhatsApp`}
            title="Chat on WhatsApp"
            type="button"
          >
            <MessageCircle size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
      
      <ContactItem
        icon={MapPin}
        text={company.location}
      />
    </div>
  );

  const renderBusinessHours = () => (
    <div className="business-hours">
      <h4>Business Hours</h4>
      <p>{company.hours.weekdays}</p>
      <p>{company.hours.sunday}</p>
    </div>
  );

  return (
    <>
      <footer className="footer" ref={footerRef} role="contentinfo">
        <div className="container">
          {/* Single responsive grid - no duplication */}
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-section">
              <div className="footer-brand">
                <h2 className="footer-title">{company.name}</h2>
                <div className="accent-line" aria-hidden="true"></div>
              </div>
              <p className="footer-description">
                {company.description}
              </p>
              
              {/* Social Media Links */}
              <div className="social-media-section">
                <h4 className="social-title">Follow Us</h4>
                <SocialLinks 
                  links={socialLinks} 
                  onSocialClick={handleSocialClick}
                />
              </div>
            </div>
            
            {/* Quick Links */}
            <FooterSection title="Shop & Explore" ariaLabel="Shop navigation">
              {renderShopLinks()}
            </FooterSection>
            
            {/* Support & Policies */}
            <FooterSection title="Support & Policies" ariaLabel="Support navigation">
              {renderSupportLinks()}
            </FooterSection>

            {/* Contact & Info */}
            <FooterSection title="Contact & Info">
              {renderContactItems()}
              {renderBusinessHours()}
            </FooterSection>
          </div>
          
          {/* Payment Methods */}
          <div className="payment-section">
            <h4 className="payment-title">Accepted Payment Methods</h4>
            <div className="payment-methods" role="list" aria-label="Accepted payment methods">
              {paymentMethods.map((method) => (
                <span 
                  key={method} 
                  className="payment-method" 
                  role="listitem"
                  aria-label={`Accepts ${method}`}
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <nav className="legal-links" aria-label="Legal links">
                {legalLinks.map(({ path, label }, index) => (
                  <React.Fragment key={path}>
                    <Link 
                      to={path} 
                      className="legal-link"
                      aria-label={label}
                    >
                      {label}
                    </Link>
                    {index < legalLinks.length - 1 && (
                      <span className="separator" aria-hidden="true">|</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
              <p className="copyright">
                &copy; {currentYear} {company.name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button
        className={`footer-back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={handleBackToTop}
        onKeyDown={(e) => handleKeyPress(e, handleBackToTop)}
        aria-label="Back to top"
        title="Back to top"
        type="button"
        tabIndex={showBackToTop ? 0 : -1}
      >
        <ChevronUp size={20} aria-hidden="true" />
      </button>
    </>
  );
};

// Performance optimization
export default React.memo(Footer);
