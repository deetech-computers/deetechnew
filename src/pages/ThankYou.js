import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Clock, 
  Gift, 
  Share2,
  Copy,
  Check,
  Mail,
  Phone
} from 'lucide-react';
import '../App.css';
import '../styles/thankyou.css';

const ThankYou = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Calculate estimated delivery date
  const calculateDeliveryDate = useCallback(() => {
    const today = new Date();
    let daysToAdd = 1; // 1 business day
    let addedDays = 0;
    
    while (addedDays < daysToAdd) {
      today.setDate(today.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (today.getDay() !== 0 && today.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Initialize data from location state
  const initializeData = useCallback(() => {
    // Get order ID from location state or generate one
    const idFromState = location.state?.orderId;
    const generatedId = 'DT' + Date.now().toString().slice(-8);
    setOrderId(idFromState || generatedId);

    // Check for affiliate data
    if (location.state?.affiliateCode && location.state?.commissionAmount) {
      setAffiliateData({
        code: location.state.affiliateCode,
        commissionAmount: location.state.commissionAmount
      });
    }

    // Show account prompt for guest users
    if (!user) {
      setShowAccountPrompt(true);
    }

    // Calculate and set delivery date
    setEstimatedDelivery(calculateDeliveryDate());
  }, [location.state, user, calculateDeliveryDate]);

  useEffect(() => {
    // Add page-specific class to body
    document.body.classList.add('thank-you-page-open');
    
    initializeData();

    // Track conversion in analytics if available
    if (window.gtag && orderId) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        currency: 'GHS'
      });
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('thank-you-page-open');
    };
  }, [initializeData, orderId]);

  const shareOrder = async () => {
    const shareText = `I just ordered from DEETECH COMPUTERS! 🎉 Order #${orderId}. Great service and quality tech products. Check them out: ${window.location.origin}/products`;
    const shareUrl = window.location.origin + '/products';
    
    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: 'My DEETECH Order',
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard
        await copyToClipboard(shareText);
      }
    } catch (error) {
      // User cancelled share or API failed
      if (error.name !== 'AbortError') {
        // Try clipboard as final fallback
        await copyToClipboard(shareText);
      }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      
      // Reset copy status after 2 seconds
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Clipboard error:', error);
      // Show prompt as last resort
      prompt('Copy this message to share:', text);
    }
  };

  const copyOrderNumber = () => {
    copyToClipboard(orderId);
  };

  const handleEmailSupport = () => {
    const subject = `Order Inquiry - ${orderId}`;
    const body = `Hello DEETECH Support,\n\nI have a question about my order #${orderId}.\n\n[Please provide details here]`;
    window.location.href = `mailto:deetechcomputers01@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCallSupport = () => {
    window.location.href = 'tel:+233591755964';
  };

  return (
    <div className="container">
      <div className="thank-you-page">
        {/* Success Header */}
        <div className="success-header">
          <CheckCircle className="success-icon" size={80} />
          <h1>Thank You for Your Order!</h1>
          
          <div className="order-number-section">
            <span className="order-label">Order #:</span>
            <span className="order-number-value">{orderId}</span>
            <button 
              onClick={copyOrderNumber} 
              className="copy-order-btn"
              aria-label="Copy order number"
            >
              {copiedToClipboard ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedToClipboard ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          
          <p className="success-message">
            Your order has been received and is being processed. 
            You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Affiliate Referral Success Section */}
        {affiliateData && (
          <div className="affiliate-referral-success">
            <div className="referral-header">
              <Gift className="referral-icon" size={32} />
              <h2>You Supported a Friend! 🎉</h2>
            </div>
            
            <div className="referral-details">
              <div className="commission-card">
                <div className="commission-amount">
                  GH₵ {affiliateData.commissionAmount.toFixed(2)}
                </div>
                <div className="commission-label">Commission Earned</div>
                <p className="commission-note">
                  Your friend will receive this commission once your order is confirmed. 
                  Thank you for supporting them!
                </p>
              </div>
              
              <div className="referral-actions">
                <button onClick={shareOrder} className="btn btn-secondary">
                  <Share2 size={16} />
                  Share Your Experience
                </button>
                <p className="share-encouragement">
                  Tell others about your DEETECH experience and help them discover great tech products!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Become an Affiliate CTA */}
        {!affiliateData && user && (
          <div className="become-affiliate-cta">
            <div className="cta-content">
              <Gift size={24} />
              <div className="cta-text">
                <h3>Want to Earn Like Your Friend?</h3>
                <p>Become a DEETECH affiliate and earn 5% commission when your friends shop using your code!</p>
              </div>
              <Link to="/affiliates" className="btn btn-secondary">
                Become an Affiliate
              </Link>
            </div>
          </div>
        )}

        {/* Guest Account Prompt */}
        {showAccountPrompt && (
          <div className="account-prompt">
            <h3>Track Your Order Easily</h3>
            <p>Create an account to track your orders and save your information for faster checkout.</p>
            <div className="prompt-actions">
              <Link to="/register" className="btn btn-large">
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Already have an account? Login
              </Link>
            </div>
          </div>
        )}

        {/* Order Timeline */}
        <div className="order-timeline">
          <h2>What happens next?</h2>
          <div className="timeline-steps">
            <div className="timeline-step active-step">
              <div className="step-icon">
                <Package size={24} />
              </div>
              <div className="step-content">
                <h3>Order Confirmation</h3>
                <p>We'll verify your payment and send order confirmation within 2 hours</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-icon">
                <Clock size={24} />
              </div>
              <div className="step-content">
                <h3>Processing</h3>
                <p>Your order will be processed and prepared for delivery</p>
                <p className="eta">Next step</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-icon">
                <Truck size={24} />
              </div>
              <div className="step-content">
                <h3>Delivery</h3>
                <p>Free delivery within 24 hours in your region</p>
                <p className="eta">Estimated: {estimatedDelivery}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="support-info">
          <h3>Need Help with Your Order?</h3>
          <p>We're here to assist you with any questions or concerns.</p>
          
          <div className="contact-options">
            <button onClick={handleEmailSupport} className="contact-option">
              <Mail size={18} />
              <div>
                <strong>Email Support</strong>
                <span>deetechcomputers01@gmail.com</span>
              </div>
            </button>
            
            <button onClick={handleCallSupport} className="contact-option">
              <Phone size={18} />
              <div>
                <strong>Phone Support</strong>
                <span>+233 591 755 964</span>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Link to="/products" className="btn btn-secondary btn-large">
            Continue Shopping
          </Link>
          
          {user && (
            <Link to="/account?tab=orders" className="btn btn-large">
  View My Orders
</Link>
          )}
          
          <button onClick={shareOrder} className="btn btn-large btn-share">
            <Share2 size={18} />
            Share Order
          </button>
        </div>

        {/* Security & Privacy Note */}
        <div className="security-note">
          <CheckCircle size={16} />
          <span>Your payment is secure and your personal information is protected</span>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;