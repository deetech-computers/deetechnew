import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

import '../styles/affiliates.css';
import '../styles/affiliateregistration.css';

import { 
  Users, TrendingUp, DollarSign, Share2, MessageCircle, ArrowRight, Gift, 
  Check, Copy, ShoppingCart, Wallet, Target, Award, BarChart3, Bell, Trophy, Star, Crown,
  Zap, Sparkles, Gift as GiftIcon, Shield, Clock, Star as StarIcon
} from 'lucide-react';
import AffiliateRegistration from '../components/AffiliateRegistration';

// Safe clipboard utility with multiple fallbacks
const safeCopyToClipboard = async (text) => {
  try {
    // Method 1: Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Method 2: Legacy execCommand method
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
    
    // Method 3: Fallback - show text for manual copy
    throw new Error('Clipboard not available');
    
  } catch (error) {
    console.warn('Clipboard copy failed:', error);
    
    // Method 4: Show text in prompt for manual copy
    const copyPrompt = window.prompt(
      'Copy to clipboard: Ctrl+C, Enter', 
      text
    );
    
    return !!copyPrompt; // Return true if user pressed OK
  }
};

function AffiliatesComponent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [copied, setCopied] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);
  const [affiliateEarnings, setAffiliateEarnings] = useState(null);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingCommission: 0,
    totalCommission: 0,
    approvedCommission: 0,
    lifetimeEarnings: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [tierInfo, setTierInfo] = useState(null);
  const [tierProgress, setTierProgress] = useState(null);
  const [showPromotionAlert, setShowPromotionAlert] = useState(false);
  const [pendingPromotions, setPendingPromotions] = useState([]);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAffiliateData = async () => {
    setLoading(true);
    try {
      // Load affiliate profile from existing table
      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading affiliate:', error);
        setAffiliateData(null);
        setAffiliateEarnings(null);
        setLoading(false);
        return;
      }

      setAffiliateData(affiliate);

      // Calculate and update tier using the new function
      await checkAndUpdateTier(affiliate.id);

      // Load tier information from the new view
      const { data: tierOverview } = await supabase
        .from('affiliate_tier_overview')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .single();

      if (tierOverview) {
        setTierInfo({
          tier_name: tierOverview.tier_name,
          tier_color: tierOverview.tier_color,
          tier_icon: tierOverview.tier_icon,
          tier_description: tierOverview.tier_description,
          tier_benefits: tierOverview.tier_benefits,
          pending_notifications: tierOverview.pending_notifications || 0
        });

        // Check for pending promotions
        if (tierOverview.pending_notifications > 0) {
          await loadPendingPromotions(affiliate.id);
          setShowPromotionAlert(true);
        }
      }

      // Load tier progress
      const { data: progressData } = await supabase
        .rpc('get_tier_progress', { affiliate_id_param: affiliate.id });

      if (progressData && !progressData.error) {
        setTierProgress(progressData);
      }

      // Load ALL referrals with detailed status for manual calculation
      const { data: allReferralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error loading referrals:', referralsError);
        setAffiliateEarnings(null);
      } else {
        // Manual calculation of all stats (more reliable than view)
        const totalReferrals = allReferralsData?.length || 0;
        const paidReferrals = allReferralsData?.filter(ref => ref.status === 'paid').length || 0;
        const approvedReferrals = allReferralsData?.filter(ref => ref.status === 'approved').length || 0;
        const pendingReferrals = allReferralsData?.filter(ref => ref.status === 'pending').length || 0;
        const cancelledReferrals = allReferralsData?.filter(ref => ref.status === 'cancelled').length || 0;

        // Calculate commission totals
        const pendingCommission = allReferralsData
          ?.filter(ref => ref.status === 'pending' || ref.status === 'approved')
          .reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0) || 0;

        const totalCommission = allReferralsData
          ?.filter(ref => ref.status === 'paid')
          .reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0) || 0;

        const lifetimeEarnings = allReferralsData
          ?.filter(ref => ref.status !== 'cancelled')
          .reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0) || 0;

        const approvedCommission = allReferralsData
          ?.filter(ref => ref.status === 'approved')
          .reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0) || 0;

        // Calculate conversion rate
        const conversionRate = totalReferrals > 0 
          ? Math.round((paidReferrals / totalReferrals) * 100) 
          : 0;

        // Get latest referral date
        const latestReferralDate = allReferralsData && allReferralsData.length > 0 
          ? allReferralsData[0].created_at 
          : null;

        // Create enhanced earnings object
        const enhancedEarnings = {
          // From existing view structure
          affiliate_id: affiliate.id,
          user_id: affiliate.user_id,
          affiliate_code: affiliate.affiliate_code,
          full_name: affiliate.full_name,
          phone_number: affiliate.phone_number,
          location: affiliate.location,
          is_active: affiliate.is_active,
          total_paid_commission: totalCommission,
          pending_commission: pendingCommission,
          lifetime_commission: lifetimeEarnings,
          lifetime_referrals: totalReferrals,
          paid_referrals: paidReferrals,
          pending_referrals: pendingReferrals,
          cancelled_referrals: cancelledReferrals,
          verified_paid_commission: totalCommission,
          latest_referral_date: latestReferralDate,
          created_at: affiliate.created_at,
          updated_at: affiliate.updated_at,
          
          // Additional calculated fields
          approved_referrals: approvedReferrals,
          approved_commission: approvedCommission,
          conversion_rate: conversionRate
        };

        setAffiliateEarnings(enhancedEarnings);

        // Set stats for backward compatibility
        setStats({
          totalReferrals,
          pendingCommission,
          approvedCommission,
          totalCommission,
          lifetimeEarnings,
          conversionRate
        });
      }

    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUpdateTier = async (affiliateId) => {
    try {
      // Call the new function to calculate and update tier
      const { data, error } = await supabase
        .rpc('calculate_affiliate_tier', { affiliate_id_param: affiliateId });

      if (error) {
        console.error('Error updating tier:', error);
      }
    } catch (error) {
      console.error('Error in tier update:', error);
    }
  };

  const loadPendingPromotions = async (affiliateId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_pending_promotions', { affiliate_id_param: affiliateId });

      if (!error && data) {
        setPendingPromotions(data);
      }
    } catch (error) {
      console.error('Error loading pending promotions:', error);
    }
  };

  const markNotificationsAsRead = async (affiliateId) => {
    try {
      const { data, error } = await supabase
        .rpc('mark_tier_notifications_read', { affiliate_id_param: affiliateId });

      if (!error) {
        setShowPromotionAlert(false);
        setPendingPromotions([]);
        // Reload tier info to update notification count
        if (affiliateData) {
          const { data: tierOverview } = await supabase
            .from('affiliate_tier_overview')
            .select('pending_notifications')
            .eq('affiliate_id', affiliateData.id)
            .single();
          
          if (tierOverview) {
            setTierInfo(prev => ({
              ...prev,
              pending_notifications: tierOverview.pending_notifications
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // FIXED: Copy group link with safe clipboard
  const copyGroupLink = async () => {
    const success = await safeCopyToClipboard('https://chat.whatsapp.com/IUdXjo4kmMvDkDqsyXPWxb');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Show alternative message if clipboard failed
      console.log('Clipboard copy failed, user may need to copy manually');
    }
  };

  // FIXED: Copy affiliate code with safe clipboard
  const copyAffiliateCode = async (code) => {
    const success = await safeCopyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Show alternative message if clipboard failed
      console.log('Clipboard copy failed, user may need to copy manually');
    }
  };

  const getTierIcon = (tierName) => {
    switch (tierName) {
      case 'Gold': return <Crown size={20} />;
      case 'Silver': return <Star size={20} />;
      case 'Bronze': return <Award size={20} />;
      default: return <TrendingUp size={20} />;
    }
  };

  const PromotionAlert = () => {
    if (!showPromotionAlert || !pendingPromotions.length) return null;

    const latestPromotion = pendingPromotions[0];
    
    return (
      <div className="promotion-alert">
        <div className="promotion-content">
          <Trophy size={24} />
          <div className="promotion-text">
            <strong>Congratulations! 🎉</strong>
            <p>
              You've been promoted from <strong>{latestPromotion.old_tier}</strong> to{' '}
              <strong>{latestPromotion.new_tier}</strong> Tier!
            </p>
            {latestPromotion.new_tier === 'Gold' && (
              <p className="gold-message">
                <strong>🎁 Special Reward:</strong> As a Gold Tier affiliate, you'll receive monthly gifts!
              </p>
            )}
          </div>
          <button 
            onClick={() => affiliateData && markNotificationsAsRead(affiliateData.id)}
            className="promotion-dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const TierProgressDisplay = () => {
    if (!tierProgress || tierProgress.error) return null;

    const progressPercentage = tierProgress.is_max_tier ? 100 : tierProgress.progress_percentage || 0;

    return (
      <div className="tier-progress-section">
        <div className="tier-progress-header">
          <h4>
            {getTierIcon(tierInfo?.tier_name || 'Starter')}
            <span>{tierInfo?.tier_name || 'Starter'} Tier</span>
          </h4>
          <span className="tier-badge" style={{ backgroundColor: tierInfo?.tier_color || 'blue' }}>
            {tierInfo?.tier_icon || '🚀'} {tierInfo?.tier_name || 'Starter'}
          </span>
        </div>
        
        {!tierProgress.is_max_tier ? (
          <div className="tier-progress-details">
            <div className="progress-info">
              <span className="current-amount">
                GH₵ {tierProgress.current_commission?.toFixed(2) || '0.00'}
              </span>
              <span className="progress-text">
                Progress to {tierProgress.next_tier}
              </span>
              <span className="needed-amount">
                Need GH₵ {tierProgress.needed_for_next?.toFixed(2) || '0.00'} more
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="tier-target">
              <span>Starter</span>
              <span>Bronze (GH₵ 500)</span>
              <span>Silver (GH₵ 1,000)</span>
              <span>Gold (GH₵ 5,000)</span>
            </div>
          </div>
        ) : (
          <div className="max-tier-message">
            <Trophy size={24} />
            <div>
              <strong>🏆 You've Reached the Highest Tier!</strong>
              <p>You're a Gold Tier affiliate! You'll receive monthly gifts and premium support.</p>
            </div>
          </div>
        )}

        {tierInfo?.tier_benefits && (
          <div className="tier-benefits">
            <h5>Tier Benefits:</h5>
            <p>{tierInfo.tier_benefits}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="affiliate-tabs">
      <div className="container">
        {/* Navigation Tabs */}
        <div className="affiliate-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Program Info
          </button>
          {user && affiliateData && (
            <button 
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              My Performance
            </button>
          )}
          {user && (
            <button 
              className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              {affiliateData ? 'My Account' : 'Join Program'}
            </button>
          )}
        </div>

        {activeTab === 'info' ? (
          <>
            {/* Hero Section */}
            <div className="affiliates-hero">
              <div className="hero-content">
                <h1>🌟 Join DEETECH Affiliates: Earn 5% + Unlock Premium Rewards!</h1>
                <p className="hero-subtitle">
                  <strong>Start with 5% Commission</strong> on every sale, then <strong>level up</strong> to earn exclusive perks, gifts, and premium benefits!
                </p>
                <p className="hero-description">
                  Everyone gets the same <strong>5% commission rate</strong> - no tier reductions! As you grow, unlock 
                  <strong> Bronze, Silver, and Gold tiers</strong> with amazing bonuses like monthly gifts, priority support, and faster payouts.
                  Turn your network into earnings with our premium tech products.
                </p>
                
                <div className="hero-actions">
                  {user ? (
                    affiliateData ? (
                      <button 
                        onClick={() => setActiveTab('stats')}
                        className="btn btn-large"
                      >
                        <TrendingUp size={20} />
                        View My Performance
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('register')}
                        className="btn btn-large"
                      >
                        <Gift size={20} />
                        Get Your Affiliate Code
                      </button>
                    )
                  ) : (
                    <Link to="/login" className="btn btn-large">
                      <Users size={20} />
                      Sign In to Join
                    </Link>
                  )}
                  
                  <div className="group-link-section">
                    <a 
                      href="https://chat.whatsapp.com/IUdXjo4kmMvDkDqsyXPWxb" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-large btn-secondary"
                    >
                      <Users size={20} />
                      Join Affiliate Group
                    </a>
                    <button 
                      onClick={copyGroupLink}
                      className="copy-link-btn"
                      title="Copy group link"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {!user && (
                  <div className="guest-notice">
                    <small>Already have an account? <Link to="/login">Sign in</Link> to get your affiliate code instantly.</small>
                  </div>
                )}
              </div>
              
              <div className="hero-visual">
                <div className="earning-card">
                  <div className="tier-badge-banner">
                    <Sparkles size={16} />
                    <span>5% Base Rate + Tier Bonuses</span>
                  </div>
                  <DollarSign size={24} />
                  <h3>Earn 5% Commission</h3>
                  <div className="earning-amount">+ Tier Rewards!</div>
                  <p>Base Rate Never Changes</p>
                  <div className="commission-example">
                    <div className="example-text">
                      <span className="example-label">Example:</span>
                      <span className="example-calculation">
                        <span className="example-amount">GHC 3,000</span> order = 
                        <span className="example-commission"> GHC 150</span> commission
                      </span>
                    </div>
                    <div className="tier-note">
                      <StarIcon size={12} />
                      <small>Plus your tier bonuses!</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <section className="how-it-works">
              <h2>How It Works: Simple 3-Step Process</h2>
              <div className="steps-visual-flow">
                <div className="step-card">
                  <div className="step-visual">
                    <div className="step-icon-wrapper">
                      <Gift size={40} />
                    </div>
                    <div className="step-number">1</div>
                  </div>
                  <h3>Get Your Code</h3>
                  <p>Register as an affiliate and receive your unique 6-character referral code</p>
                </div>
                
                <div className="flow-arrow">→</div>
                
                <div className="step-card">
                  <div className="step-visual">
                    <div className="step-icon-wrapper">
                      <Share2 size={40} />
                    </div>
                    <div className="step-number">2</div>
                  </div>
                  <h3>Share Your Code</h3>
                  <p>Share your code with friends, family, or on social media</p>
                </div>
                
                <div className="flow-arrow">→</div>
                
                <div className="step-card">
                  <div className="step-visual">
                    <div className="step-icon-wrapper">
                      <DollarSign size={40} />
                    </div>
                    <div className="step-number">3</div>
                  </div>
                  <h3>Earn & Level Up</h3>
                  <p>Earn 5% commission + unlock tier rewards as you grow!</p>
                </div>
              </div>
            </section>

            {/* Commission Structure */}
            <section className="commission-section">
              <div className="commission-header">
                <h2>Simple 5% Commission + Tier Rewards System</h2>
                <p className="section-subtitle">Your commission rate stays at 5% forever - earn more with tier bonuses!</p>
              </div>
              
              <div className="commission-highlight">
                <div className="commission-rate">
                  <span className="rate-number">5%</span>
                  <span className="rate-label">Lifetime Base Rate</span>
                  <small>Never decreases!</small>
                </div>
                <div className="commission-features">
                  <div className="feature-item">
                    <Check size={20} />
                    <span><strong>5% for everyone</strong> - no tier reductions</span>
                  </div>
                  <div className="feature-item">
                    <Check size={20} />
                    <span>Instant payouts for all tiers</span>
                  </div>
                  <div className="feature-item">
                    <Check size={20} />
                    <span>Unlock premium rewards as you grow</span>
                  </div>
                </div>
              </div>
              
              <div className="tier-rewards-overview">
                <h3>🌟 Tier Rewards & Benefits</h3>
                <div className="tier-rewards-grid">
                  <div className="tier-reward-card bronze">
                    <div className="tier-reward-header">
                      <Award size={24} />
                      <h4>Bronze Tier</h4>
                      <span className="tier-requirement">(Earn GH₵ 500+)</span>
                    </div>
                    <ul className="tier-benefits-list">
                      <li><Check size={16} /> Priority Support Access</li>
                      <li><Check size={16} /> Exclusive Marketing Materials</li>
                      <li><Check size={16} /> 5% Commission Rate</li>
                    </ul>
                  </div>
                  
                  <div className="tier-reward-card silver">
                    <div className="tier-reward-header">
                      <Star size={24} />
                      <h4>Silver Tier</h4>
                      <span className="tier-requirement">(Earn GH₵ 1,000+)</span>
                    </div>
                    <ul className="tier-benefits-list">
                      <li><Check size={16} /> All Bronze Benefits</li>
                      <li><Check size={16} /> Faster Payout Processing</li>
                      <li><Check size={16} /> Advanced Analytics Dashboard</li>
                      <li><Check size={16} /> 5% Commission Rate</li>
                    </ul>
                  </div>
                  
                  <div className="tier-reward-card gold">
                    <div className="tier-reward-header">
                      <Crown size={24} />
                      <h4>Gold Tier</h4>
                      <span className="tier-requirement">(Earn GH₵ 5,000+)</span>
                    </div>
                    <ul className="tier-benefits-list">
                      <li><Check size={16} /> All Silver Benefits</li>
                      <li><Check size={16} /> <strong>Monthly Gift Rewards</strong></li>
                      <li><Check size={16} /> Premium 1-on-1 Support</li>
                      <li><Check size={16} /> Early Access to New Products</li>
                      <li><Check size={16} /> 5% Commission Rate</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="commission-examples">
                <div className="example-card">
                  <div className="example-header">
                    <h3>💸 Sample Earnings (5% Commission)</h3>
                  </div>
                  <div className="example-list">
                    <div className="example-item">
                      <span className="product">Basic Laptop</span>
                      <span className="price">GHC 2,500</span>
                      <span className="commission">→ GHC 125</span>
                    </div>
                    <div className="example-item">
                      <span className="product">Gaming PC</span>
                      <span className="price">GHC 4,000</span>
                      <span className="commission">→ GHC 200</span>
                    </div>
                    <div className="example-item">
                      <span className="product">Premium Setup</span>
                      <span className="price">GHC 6,000</span>
                      <span className="commission">→ GHC 300</span>
                    </div>
                  </div>
                  <div className="example-note">
                    <Sparkles size={14} />
                    <small>Plus your tier bonuses on top of these commissions!</small>
                  </div>
                </div>
              </div>
            </section>

            {/* Why Join Section */}
            <section className="benefits-section">
              <h2>Why Join DEETECH Affiliates?</h2>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">💸</div>
                  <h3>5% Guaranteed Commission</h3>
                  <p>Your rate stays at 5% forever - no reductions when you tier up!</p>
                </div>
                
                <div className="benefit-card">
                  <div className="benefit-icon">🏆</div>
                  <h3>Tier Rewards System</h3>
                  <p>Earn exclusive bonuses, gifts, and premium benefits as you grow</p>
                </div>
                
                <div className="benefit-card">
                  <div className="benefit-icon">⚡</div>
                  <h3>Instant Tracking & Payouts</h3>
                  <p>Real-time dashboard and instant mobile money payments</p>
                </div>
                
                <div className="benefit-card">
                  <div className="benefit-icon">🛡️</div>
                  <h3>Quality Products</h3>
                  <p>Represent premium, reliable tech products that customers trust</p>
                </div>
                
                <div className="benefit-card">
                  <div className="benefit-icon">👑</div>
                  <h3>Gold Tier Monthly Gifts</h3>
                  <p>Reach Gold tier and receive special monthly gift rewards</p>
                </div>
                
                <div className="benefit-card">
                  <div className="benefit-icon">📈</div>
                  <h3>Unlimited Earnings</h3>
                  <p>No caps on commissions - earn as much as you want!</p>
                </div>
              </div>
            </section>

            {/* Tier Progress Preview */}
            <section className="tier-preview-section">
              <div className="tier-preview-header">
                <h2>🚀 Your Journey to Gold Tier</h2>
                <p>Start with 5%, grow your earnings, and unlock amazing rewards</p>
              </div>
              
              <div className="tier-journey-visual">
                <div className="tier-milestone">
                  <div className="milestone-icon">🎯</div>
                  <h4>Starter Tier</h4>
                  <p>5% Commission</p>
                  <div className="milestone-status active">You Start Here</div>
                </div>
                
                <div className="journey-arrow">→</div>
                
                <div className="tier-milestone">
                  <div className="milestone-icon bronze">🥉</div>
                  <h4>Bronze Tier</h4>
                  <p>Earn GH₵ 500+</p>
                  <ul className="milestone-benefits">
                    <li>Priority Support</li>
                    <li>Marketing Materials</li>
                  </ul>
                </div>
                
                <div className="journey-arrow">→</div>
                
                <div className="tier-milestone">
                  <div className="milestone-icon silver">🥈</div>
                  <h4>Silver Tier</h4>
                  <p>Earn GH₵ 1,000+</p>
                  <ul className="milestone-benefits">
                    <li>Faster Payouts</li>
                    <li>Advanced Dashboard</li>
                  </ul>
                </div>
                
                <div className="journey-arrow">→</div>
                
                <div className="tier-milestone">
                  <div className="milestone-icon gold">🏆</div>
                  <h4>Gold Tier</h4>
                  <p>Earn GH₵ 5,000+</p>
                  <ul className="milestone-benefits">
                    <li><strong>Monthly Gifts</strong></li>
                    <li>Premium Support</li>
                    <li>Early Access</li>
                  </ul>
                </div>
              </div>
              
              <div className="tier-journey-note">
                <Zap size={20} />
                <p><strong>Important:</strong> Your commission rate stays at 5% through ALL tiers. 
                Tier rewards are bonuses on top of your earnings!</p>
              </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
              <div className="cta-content">
                <h2>Start Earning Today - Level Up Tomorrow!</h2>
                <p>Join our growing affiliate community. Get your unique code, start with 5% commission, 
                and work your way up to Gold Tier with monthly gifts and premium benefits.</p>
                
                <div className="cta-actions">
                  {user ? (
                    affiliateData ? (
                      <button 
                        onClick={() => setActiveTab('stats')}
                        className="btn btn-large"
                      >
                        <TrendingUp size={20} />
                        View My Performance
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('register')}
                        className="btn btn-large"
                      >
                        <Gift size={20} />
                        Get Your Affiliate Code
                        <ArrowRight size={16} />
                      </button>
                    )
                  ) : (
                    <Link to="/login" className="btn btn-large">
                      <Users size={20} />
                      Sign In to Get Started
                      <ArrowRight size={16} />
                    </Link>
                  )}
                  
                  <div className="cta-links">
                    <a 
                      href="https://wa.me/233591755964" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <MessageCircle size={16} />
                      Questions? Chat Us
                    </a>
                    
                    <Link to="/products" className="btn btn-outline">
                      Browse Products
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-accordion">
                <div className="faq-item">
                  <button className="faq-question" onClick={(e) => {
                    const item = e.currentTarget.parentElement;
                    item.classList.toggle('active');
                  }}>
                    <span>Does my commission rate decrease when I tier up?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <p><strong>No!</strong> Your commission rate stays at 5% forever. Tiers add bonuses and rewards 
                    on top of your earnings. Bronze, Silver, and Gold all earn the same 5% base rate.</p>
                  </div>
                </div>
                
                <div className="faq-item">
                  <button className="faq-question" onClick={(e) => {
                    const item = e.currentTarget.parentElement;
                    item.classList.toggle('active');
                  }}>
                    <span>What are the Gold Tier monthly gifts?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <p>Gold Tier affiliates receive special gift rewards each month! These could include tech accessories, 
                    exclusive merchandise, or bonus cash rewards. Gifts vary monthly and are our way of thanking our top affiliates.</p>
                  </div>
                </div>
                
                <div className="faq-item">
                  <button className="faq-question" onClick={(e) => {
                    const item = e.currentTarget.parentElement;
                    item.classList.toggle('active');
                  }}>
                    <span>How do I level up through tiers?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <p>You level up automatically based on your total lifetime commission earnings: 
                    GH₵ 500+ for Bronze, GH₵ 1,000+ for Silver, GH₵ 5,000+ for Gold. The system tracks 
                    this automatically and promotes you instantly.</p>
                  </div>
                </div>
                
                <div className="faq-item">
                  <button className="faq-question" onClick={(e) => {
                    const item = e.currentTarget.parentElement;
                    item.classList.toggle('active');
                  }}>
                    <span>How are commissions paid?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <p>Commissions are paid instantly via mobile money to your registered Ghana number. 
                    Silver and Gold tiers get even faster processing times!</p>
                  </div>
                </div>
                
                <div className="faq-item">
                  <button className="faq-question" onClick={(e) => {
                    const item = e.currentTarget.parentElement;
                    item.classList.toggle('active');
                  }}>
                    <span>Is there any cost to join?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <p>Absolutely free! No registration fees. You only earn - you never pay.</p>
                  </div>
                </div>
                
                <div className="faq-item">
                  <button className="faq-question" onClick={(e) => {
                    const item = e.currentTarget.parentElement;
                    item.classList.toggle('active');
                  }}>
                    <span>Can I track my referrals and tier progress?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <p>Yes! Once registered, you'll have access to a dashboard showing all your referrals, 
                    earnings, and your progress toward the next tier with a visual progress bar.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : activeTab === 'stats' ? (
          /* Affiliate Performance Stats Section */
          <div className="affiliate-performance-page">
            <div className="page-header">
              <h1>My Affiliate Performance</h1>
              <p>Track your comprehensive earnings and tier progress</p>
              {affiliateData && (
                <div className="affiliate-code-badge">
                  <h1>Your Code:</h1> <strong>{affiliateData.affiliate_code}</strong>
                </div>
              )}
            </div>

            {/* Promotion Alert */}
            {showPromotionAlert && <PromotionAlert />}

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your performance data...</p>
              </div>
            ) : (
              <>
                {/* Tier Progress Section */}
                {tierInfo && <TierProgressDisplay />}

                {/* Performance Overview Cards */}
                <div className="performance-stats-grid">
                  <div className="stat-card primary">
                    <div className="stat-icon">
                      <Users size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalReferrals}</h3>
                      <p>Total Referrals</p>
                      <div className="stat-subtext">
                        {affiliateEarnings?.paid_referrals || 0} successful • {affiliateEarnings?.pending_referrals || 0} pending
                      </div>
                    </div>
                  </div>

                  <div className="stat-card warning">
                    <div className="stat-icon">
                      <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>GH₵ {stats.pendingCommission.toFixed(2)}</h3>
                      <p>Pending Commission</p>
                      <div className="stat-subtext">
                        Awaiting order completion
                      </div>
                    </div>
                  </div>

                  <div className="stat-card success">
                    <div className="stat-icon">
                      <ShoppingCart size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>GH₵ {stats.approvedCommission.toFixed(2)}</h3>
                      <p>Ready for Payout</p>
                      <div className="stat-subtext">
                        Approved commissions
                      </div>
                    </div>
                  </div>

                  <div className="stat-card info">
                    <div className="stat-icon">
                      <Wallet size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>GH₵ {stats.totalCommission.toFixed(2)}</h3>
                      <p>Total Paid Out</p>
                      <div className="stat-subtext">
                        Commission received
                      </div>
                    </div>
                  </div>

                  <div className="stat-card premium">
                    <div className="stat-icon">
                      <BarChart3 size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>GH₵ {stats.lifetimeEarnings.toFixed(2)}</h3>
                      <p>Lifetime Generated</p>
                      <div className="stat-subtext">
                        Excludes cancelled orders
                      </div>
                    </div>
                  </div>

                  <div className="stat-card secondary">
                    <div className="stat-icon">
                      <Target size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>{stats.conversionRate}%</h3>
                      <p>Success Rate</p>
                      <div className="stat-subtext">
                        Referral conversion
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Tier & Additional Info */}
                {affiliateEarnings && (
                  <div className="performance-details">
                    <div className="detail-card">
                      <h3>Referral Breakdown</h3>
                      <div className="breakdown-stats">
                        <div className="breakdown-item">
                          <span>Total Referrals:</span>
                          <strong>{affiliateEarnings.lifetime_referrals || 0}</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>Successful Referrals:</span>
                          <strong className="text-success">{affiliateEarnings.paid_referrals || 0}</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>Pending Approval:</span>
                          <strong className="text-warning">{affiliateEarnings.pending_referrals || 0}</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>Cancelled Referrals:</span>
                          <strong className="text-danger">{affiliateEarnings.cancelled_referrals || 0}</strong>
                        </div>
                        <div className="breakdown-item">
                          <span>Last Referral:</span>
                          <strong>
                            {affiliateEarnings.latest_referral_date 
                              ? new Date(affiliateEarnings.latest_referral_date).toLocaleDateString()
                              : 'No referrals yet'
                            }
                          </strong>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tier Benefits Summary */}
                    {tierInfo && (
                      <div className="detail-card tier-benefits-summary">
                        <h3>Your Tier Benefits</h3>
                        <div className="current-tier-highlight">
                          <div className="tier-icon">
                            {getTierIcon(tierInfo.tier_name)}
                          </div>
                          <div className="tier-details">
                            <h4>{tierInfo.tier_name} Tier</h4>
                            <p>You're earning <strong>5% commission</strong> on every sale</p>
                            {tierInfo.tier_benefits && (
                              <div className="active-benefits">
                                <small>Active Benefits: {tierInfo.tier_benefits}</small>
                              </div>
                            )}
                          </div>
                        </div>
                        {tierInfo.tier_name !== 'Gold' && (
                          <div className="next-tier-preview">
                            <Sparkles size={16} />
                            <span>
                              Unlock <strong>{tierProgress?.next_tier || 'Bronze'}</strong> tier at 
                              GH₵ {tierProgress?.needed_for_next?.toFixed(2) || '500.00'} more
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Action Buttons */}
              <div className="performance-actions">
                <Link to="/affiliate-dashboard" className="btn btn-large">
                  <TrendingUp size={20} />
                  View Detailed Dashboard
                </Link>
                <button onClick={() => setActiveTab('register')} className="btn btn-secondary">
                  Manage Account
                </button>
                <a 
                  href="https://chat.whatsapp.com/IUdXjo4kmMvDkDqsyXPWxb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <Users size={16} />
                  Join Support Group
                </a>
              </div>
              </>
            )}
          </div>
        ) : (
          /* Affiliate Registration Section */
          <div className="affiliate-registration-page">
            <div className="page-header">
              <h1>
                {affiliateData ? 'My Affiliate Account' : 'Become a DEETECH Affiliate'}
              </h1>
              <p>
                {affiliateData 
                  ? 'Manage your affiliate account and track your tier progress'
                  : 'Get your unique referral code and start earning 5% commission + tier rewards'
                }
              </p>
            </div>

            {affiliateData ? (
              <div className="affiliate-success">
                <div className="success-header">
                  <div className="success-icon">🎉</div>
                  <div>
                    <h2>Welcome to DEETECH Affiliates!</h2>
                    <p className="success-subtitle">
                      You're earning <strong>5% commission</strong> on every sale
                      {tierInfo?.tier_name && ` • Currently in ${tierInfo.tier_name} Tier`}
                    </p>
                  </div>
                </div>
                
                <div className="affiliate-info">
                  <div className="info-card">
                    <h4>Your Affiliate Code</h4>
                    <div className="code-display">
                      <span className="affiliate-code">{affiliateData.affiliate_code}</span>
                      <button 
                        onClick={() => copyAffiliateCode(affiliateData.affiliate_code)}
                        className="copy-btn"
                        title="Copy code"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p>Share this code with friends and earn 5% commission on their purchases!</p>
                  </div>

                  <div className="affiliate-stats">
                    <div className="stat">
                      <span className="stat-label">Total Referrals</span>
                      <span className="stat-value">{stats.totalReferrals}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Commission</span>
                      <span className="stat-value">GH₵ {stats.lifetimeEarnings.toFixed(2)}</span>
                    </div>
                    {tierInfo && (
                      <div className="stat tier-stat">
                        <span className="stat-label">Current Tier</span>
                        <span className="stat-value tier-value">
                          {getTierIcon(tierInfo.tier_name)}
                          {tierInfo.tier_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="affiliate-instructions">
                    <h5>How It Works:</h5>
                    <ul>
                      <li>Share your unique code with friends and family</li>
                      <li>When they make a purchase, they enter your code at checkout</li>
                      <li>You earn 5% commission on their order total</li>
                      <li>Commission is paid out instantly via mobile money</li>
                      <li><strong>Bonus:</strong> Level up through tiers for additional rewards!</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <AffiliateRegistration />
            )}
            
            <div className="affiliate-additional-info">
              <div className="affiliate-info-card">
                <h3>💡 Pro Tips for Success</h3>
                <ul>
                  <li>Share your code on social media with product recommendations</li>
                  <li>Include your code when recommending products to friends</li>
                  <li>Join our WhatsApp group for marketing materials and tips</li>
                  <li>Be genuine - recommend products you truly believe in</li>
                  <li><strong>Track your tier progress</strong> - aim for Gold to get monthly gifts!</li>
                </ul>
              </div>
              
              <div className="affiliate-support-card">
                <h3>Need Help?</h3>
                <p>Join our affiliate community for support and tips:</p>
                <a 
                  href="https://chat.whatsapp.com/IUdXjo4kmMvDkDqsyXPWxb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <Users size={16} />
                  Join WhatsApp Group
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Affiliates = AffiliatesComponent;

export default Affiliates;