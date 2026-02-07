// src/components/AffiliateRegistration.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { User, Phone, MapPin, Gift, Copy, Check } from 'lucide-react';

const AffiliateRegistration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    location: ''
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAffiliateStatus();
  }, [user]);

  const checkAffiliateStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setIsAffiliate(true);
        setAffiliateData(data);
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    }
  };

  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const affiliateCode = generateAffiliateCode();

      const { data, error } = await supabase
        .from('affiliates')
        .insert([
          {
            user_id: user.id,
            affiliate_code: affiliateCode,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            location: formData.location
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setIsAffiliate(true);
      setAffiliateData(data);
    } catch (error) {
      console.error('Error registering as affiliate:', error);
      alert('Error registering as affiliate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (affiliateData?.affiliate_code) {
      await navigator.clipboard.writeText(affiliateData.affiliate_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!user) {
    return (
      <div className="affiliate-section">
        <div className="auth-required">
          <Gift size={48} />
          <h3>Become an Affiliate</h3>
          <p>Please sign in to register as an affiliate and start earning commissions.</p>
        </div>
      </div>
    );
  }

  if (isAffiliate && affiliateData) {
    return (
      <div className="affiliate-section">
        <div className="affiliate-success">
          <div className="success-header">
            <Gift size={48} className="success-icon" />
            <h3>Welcome to DEETECH Affiliates! 🎉</h3>
          </div>
          
          <div className="affiliate-info">
            <div className="info-card">
              <h4>Your Affiliate Code</h4>
              <div className="code-display">
                <span className="affiliate-code">{affiliateData.affiliate_code}</span>
                <button 
                  onClick={copyToClipboard}
                  className="copy-btn"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <small>Share this code with friends and earn 5% commission on their purchases!</small>
            </div>

            <div className="affiliate-stats">
              <div className="stat">
                <span className="stat-label">Total Referrals</span>
                <span className="stat-value">{affiliateData.total_referrals || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Commission</span>
                <span className="stat-value">GH₵ {(affiliateData.total_commission || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="affiliate-instructions">
              <h5>How It Works:</h5>
              <ul>
                <li>Share your unique code with friends and family</li>
                <li>When they make a purchase, they enter your code at checkout</li>
                <li>You earn 5% commission on their order total</li>
                <li>Commission is paid out Instantly via mobile money</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="affiliate-section">
      <div className="affiliate-registration">
        <div className="registration-header">
          <Gift size={32} />
          <h3>Become a DEETECH Affiliate</h3>
          <p>Earn 5% commission on every purchase made with your referral code</p>
        </div>

        <form onSubmit={handleSubmit} className="affiliate-form">
          <div className="form-group">
            <label htmlFor="fullName">
              <User size={16} />
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              placeholder="e.g., 0241234567"
              pattern="[0-9]{10}"
            />
            <small>10-digit Ghana number for commission payments</small>
          </div>

          <div className="form-group">
            <label htmlFor="location">
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Your city/town in Ghana"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-large"
            disabled={loading}
          >
            {loading ? 'Generating Your Code...' : 'Become an Affiliate'}
          </button>

          <div className="terms-notice">
            <small>
              By registering, you agree to our affiliate terms. You'll receive a unique code that you can share. 
              Each successful referral earns you 5% commission paid via mobile money.
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliateRegistration;