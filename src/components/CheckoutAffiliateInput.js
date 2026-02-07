// src/components/CheckoutAffiliateInput.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Gift, Check, X, Info } from 'lucide-react';
import '../styles/checkoutaffiliateinput.css';


// Helper function to sanitize affiliate codes
const sanitizeAffiliateCode = (code) => {
  if (!code) return '';
  // Remove special characters, keep only alphanumeric and basic symbols
  return code.replace(/[^\w\s\-_]/g, '').trim().toUpperCase();
};

const CheckoutAffiliateInput = ({ onAffiliateCodeChange }) => {
  const [affiliateCode, setAffiliateCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validCode, setValidCode] = useState(null);
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState(null);

  useEffect(() => {
    // Load saved affiliate code from localStorage
    const savedCode = localStorage.getItem('checkout_affiliate_code');
    if (savedCode) {
      setAffiliateCode(savedCode);
      validateAffiliateCode(savedCode);
    }

    // Cleanup timeout on unmount
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, []);

  const validateAffiliateCode = async (code) => {
    const cleanCode = sanitizeAffiliateCode(code);
    
    if (!cleanCode) {
      setValidCode(null);
      setAffiliateInfo(null);
      onAffiliateCodeChange(null);
      localStorage.removeItem('checkout_affiliate_code');
      return;
    }

    // Minimum length check
    if (cleanCode.length < 3) {
      setValidCode(null);
      return;
    }

    setLoading(true);
    
    try {
      console.log('Validating affiliate code:', cleanCode);
      
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, full_name, affiliate_code, is_active')
        .eq('affiliate_code', cleanCode)
        .eq('is_active', true)
        .single();

      console.log('Validation response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows returned - code not found
          setValidCode(false);
          setAffiliateInfo(null);
          onAffiliateCodeChange(null);
        } else {
          // Other errors
          setValidCode(false);
          setAffiliateInfo(null);
          onAffiliateCodeChange(null);
        }
      } else if (data) {
        setValidCode(true);
        setAffiliateInfo(data);
        onAffiliateCodeChange(cleanCode);
        localStorage.setItem('checkout_affiliate_code', cleanCode);
      } else {
        setValidCode(false);
        setAffiliateInfo(null);
        onAffiliateCodeChange(null);
      }
    } catch (error) {
      console.error('Error validating affiliate code:', error);
      setValidCode(false);
      setAffiliateInfo(null);
      onAffiliateCodeChange(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setAffiliateCode(code);
    
    // Clear previous timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Set new timeout for validation (debounce)
    const newTimeout = setTimeout(() => {
      validateAffiliateCode(code);
    }, 800); // Increased debounce time
    
    setValidationTimeout(newTimeout);
  };

  const clearCode = () => {
    setAffiliateCode('');
    setValidCode(null);
    setAffiliateInfo(null);
    onAffiliateCodeChange(null);
    localStorage.removeItem('checkout_affiliate_code');
    
    // Clear any pending validation
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
  };

  const handleInfoToggle = () => {
    setShowInfo(!showInfo);
  };

  return (
    <div className="checkout-affiliate-input-section">
      <div className="checkout-section-header">
        <h4>
          <Gift size={20} />
          Affiliate Code (Optional)
        </h4>
        <button
          type="button"
          className="checkout-info-btn"
          onClick={handleInfoToggle}
          title="Learn about affiliate codes"
        >
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="checkout-affiliate-info-card">
          <p>
            <strong>Support a friend and help them earn!</strong> Enter their affiliate code 
            and they'll receive commission from your order. The price remains the same for you.
          </p>
          <p className="checkout-info-note">
            Only alphanumeric characters, spaces, hyphens, and underscores are allowed.
          </p>
        </div>
      )}

      <div className="checkout-affiliate-input-group">
        <div className="checkout-input-with-validation">
          <input
            type="text"
            value={affiliateCode}
            onChange={handleCodeChange}
            placeholder="Enter affiliate code (e.g., JOHN123)"
            className={`checkout-affiliate-input ${
              validCode === true ? 'checkout-valid' : 
              validCode === false ? 'checkout-invalid' : ''
            }`}
            maxLength="20"
            disabled={loading}
          />
          
          {loading && (
            <div className="checkout-validation-spinner"></div>
          )}
          
          {validCode === true && !loading && (
            <div className="checkout-validation-icon checkout-valid">
              <Check size={16} />
            </div>
          )}
          
          {validCode === false && !loading && (
            <div className="checkout-validation-icon checkout-invalid">
              <X size={16} />
            </div>
          )}
        </div>

        {affiliateCode && !loading && (
          <button
            type="button"
            onClick={clearCode}
            className="checkout-clear-btn"
            title="Clear code"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {validCode === true && affiliateInfo && (
        <div className="checkout-affiliate-success-message">
          <Check size={16} />
          <div>
            <strong>Valid code!</strong> {affiliateInfo.full_name} will receive commission from your order.
          </div>
        </div>
      )}

      {validCode === false && !loading && (
        <div className="checkout-affiliate-error-message">
          <X size={16} />
          <div>
            <strong>Invalid affiliate code.</strong> Please check the code and try again.
          </div>
        </div>
      )}

      {loading && (
        <div className="checkout-affiliate-info-message">
          <div className="checkout-validation-spinner checkout-small"></div>
          <span>Validating code...</span>
        </div>
      )}
    </div>
  );
};

export default CheckoutAffiliateInput;