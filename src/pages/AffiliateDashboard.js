import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import '../App.css';
import '../styles/affiliatedashboard.css';

import { 
  Users, 
  DollarSign, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Calendar,
  ShoppingCart,
  BarChart3,
  Award,
  Clock,
  RefreshCw,
  Target,
  Zap,
  Wallet,
  Trophy,
  Crown,
  Star,
  TrendingUp,
  Bell,
  Sparkles
} from 'lucide-react';

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState(null);
  const [affiliateEarnings, setAffiliateEarnings] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [allReferrals, setAllReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingCommission: 0,
    totalCommission: 0,
    approvedCommission: 0,
    lifetimeEarnings: 0,
    conversionRate: 0
  });
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // New state for tier system
  const [tierInfo, setTierInfo] = useState(null);
  const [tierProgress, setTierProgress] = useState(null);
  const [showPromotionAlert, setShowPromotionAlert] = useState(false);
  const [pendingPromotions, setPendingPromotions] = useState([]);

  // FIX: Add refs to prevent multiple loads and cache data
  const dataCache = useRef({
    affiliateData: null,
    earnings: null,
    allReferrals: null,
    tierInfo: null,
    lastFetched: null
  });
  
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // FIX: Use useEffect to load data only once when component mounts
  useEffect(() => {
    if (user?.id) {
      loadAffiliateData();
    }
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingRef.current = false;
    };
  }, [user?.id]); // Only depend on user.id

  // FIX: Removed timeRange from dependencies - we'll handle it differently

  // Enhanced loadAffiliateData function with caching and rate limiting
  const loadAffiliateData = async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    
    // Check cache first (5 minute cache)
    const cacheValid = dataCache.current.lastFetched && 
      (Date.now() - new Date(dataCache.current.lastFetched).getTime() < 300000); // 5 minutes
    
    if (cacheValid && dataCache.current.affiliateData) {
      console.log('📦 Using cached affiliate data');
      setAffiliateData(dataCache.current.affiliateData);
      setAffiliateEarnings(dataCache.current.earnings);
      setAllReferrals(dataCache.current.allReferrals || []);
      setTierInfo(dataCache.current.tierInfo);
      
      // Calculate stats from cached data
      calculateStatsFromCache();
      
      // Load filtered referrals separately
      loadFilteredReferrals();
      
      setLoading(false);
      loadingRef.current = false;
      return;
    }
    
    try {
      console.log('🚀 Loading affiliate data...');
      
      // 1. Load affiliate profile (single call)
      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (abortControllerRef.current?.signal.aborted) return;

      if (error) {
        console.error('Error loading affiliate:', error);
        setAffiliateData(null);
        setAffiliateEarnings(null);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      setAffiliateData(affiliate);
      dataCache.current.affiliateData = affiliate;

      // 2. Load ALL referrals with detailed status for manual calculation
      const { data: allReferralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (abortControllerRef.current?.signal.aborted) return;

      if (referralsError) {
        console.error('Error loading referrals:', referralsError);
        setAllReferrals([]);
        dataCache.current.allReferrals = [];
      } else {
        setAllReferrals(allReferralsData || []);
        dataCache.current.allReferrals = allReferralsData || [];
      }

      // 3. Calculate stats manually (no additional API calls)
      calculateAndSetStats(allReferralsData || [], affiliate);

      // 4. Load tier information (if available)
      await loadTierInfo(affiliate.id);

      // 5. Load filtered referrals for display (with time range)
      loadFilteredReferrals();

      // Update cache timestamp
      dataCache.current.lastFetched = new Date().toISOString();

    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  };

  const calculateAndSetStats = (allReferralsData, affiliate) => {
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
    dataCache.current.earnings = enhancedEarnings;

    // Set stats for backward compatibility
    setStats({
      totalReferrals,
      pendingCommission,
      approvedCommission,
      totalCommission,
      lifetimeEarnings,
      conversionRate
    });
  };

  const calculateStatsFromCache = () => {
    const allReferralsData = dataCache.current.allReferrals || [];
    const affiliate = dataCache.current.affiliateData;
    
    if (affiliate && allReferralsData) {
      calculateAndSetStats(allReferralsData, affiliate);
    }
  };

  const loadTierInfo = async (affiliateId) => {
    try {
      // Load tier information from the new view (single call)
      const { data: tierOverview } = await supabase
        .from('affiliate_tier_overview')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .maybeSingle(); // Use maybeSingle instead of single

      if (tierOverview) {
        setTierInfo({
          tier_name: tierOverview.tier_name,
          tier_color: tierOverview.tier_color,
          tier_icon: tierOverview.tier_icon,
          tier_description: tierOverview.tier_description,
          tier_benefits: tierOverview.tier_benefits,
          pending_notifications: tierOverview.pending_notifications || 0
        });
        
        dataCache.current.tierInfo = tierOverview;

        // Check for pending promotions
        if (tierOverview.pending_notifications > 0) {
          await loadPendingPromotions(affiliateId);
          setShowPromotionAlert(true);
        }
      }

      // Load tier progress (optional - don't block loading if this fails)
      try {
        const { data: progressData } = await supabase
          .rpc('get_tier_progress', { affiliate_id_param: affiliateId });

        if (progressData && !progressData.error) {
          setTierProgress(progressData);
        }
      } catch (progressError) {
        console.log('Tier progress optional:', progressError);
        // Don't fail the whole load if this optional call fails
      }

    } catch (error) {
      console.error('Error loading tier info:', error);
      // Don't fail the whole load if tier info fails
    }
  };

  const loadFilteredReferrals = async () => {
    if (!affiliateData?.id) return;
    
    try {
      let referralQuery = supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false });

      // Apply time filter only to displayed referrals
      if (timeRange === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        referralQuery = referralQuery.gte('created_at', oneMonthAgo.toISOString());
      } else if (timeRange === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        referralQuery = referralQuery.gte('created_at', oneWeekAgo.toISOString());
      }

      const { data: filteredReferralData, error: referralError } = await referralQuery;

      if (abortControllerRef.current?.signal.aborted) return;

      if (referralError) {
        console.error('Error loading filtered referrals:', referralError);
        setReferrals([]);
      } else {
        setReferrals(filteredReferralData || []);
      }
    } catch (error) {
      console.error('Error loading filtered referrals:', error);
    }
  };

  // FIX: Separate effect to handle time range changes
  useEffect(() => {
    if (affiliateData?.id && !loadingRef.current) {
      loadFilteredReferrals();
    }
  }, [timeRange, affiliateData?.id]);

  const checkAndUpdateTier = async (affiliateId) => {
    // This should be called infrequently (e.g., after a successful referral)
    // Not on every page load
    try {
      const { data, error } = await supabase
        .rpc('calculate_affiliate_tier', { affiliate_id_param: affiliateId });

      if (error) {
        console.error('Error updating tier:', error);
      } else if (data) {
        // Clear cache since tier was updated
        dataCache.current.lastFetched = null;
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
        // Update tier info to clear notification count
        if (tierInfo) {
          setTierInfo(prev => ({
            ...prev,
            pending_notifications: 0
          }));
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const refreshData = async () => {
    // Clear cache and reload
    dataCache.current.lastFetched = null;
    setRefreshing(true);
    await loadAffiliateData();
  };

  // Safe clipboard function with comprehensive fallbacks
  const copyToClipboard = async (text) => {
    try {
      // First try: Modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // Second try: Legacy clipboard API (for older browsers)
      if (document.execCommand) {
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
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      }
      
      // Third try: Fallback - show text to user to copy manually
      alert(`Please copy this text manually:\n\n${text}`);
      
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Final fallback
      alert(`Please copy this text manually:\n\n${text}`);
    }
  };

  const copyAffiliateCode = async () => {
    if (affiliateData?.affiliate_code) {
      await copyToClipboard(affiliateData.affiliate_code);
    }
  };

  const getShareMessage = () => {
    const baseUrl = window.location.origin;
    return `🖥️ Get amazing deals on computers and tech gadgets at DEETECH COMPUTERS! Use my affiliate code "${affiliateData?.affiliate_code}" at checkout for special discounts. I'll earn commission on your purchase too! 🚀 ${baseUrl}/products`;
  };

  const shareAffiliateCode = async () => {
    const shareText = getShareMessage();
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shop at DEETECH COMPUTERS - Best Tech Deals!',
          text: shareText,
          url: window.location.origin + '/products'
        });
        return; // Successfully shared, exit function
      } catch (error) {
        console.log('Web Share failed, falling back to clipboard:', error);
        // Fall through to clipboard method
      }
    }
    
    // Fallback to clipboard
    await copyToClipboard(shareText);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'orange', label: 'Pending', icon: '⏳' },
      approved: { color: 'blue', label: 'Approved', icon: '✅' },
      paid: { color: 'green', label: 'Paid', icon: '💰' },
      cancelled: { color: 'red', label: 'Cancelled', icon: '❌' }
    };
    
    const config = statusConfig[status] || { color: 'gray', label: status, icon: '❓' };
    return (
      <span className={`affiliate-dashboard-status-badge ${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const getFilteredReferralsCount = () => {
    return referrals.length;
  };

  const getReferralTrend = () => {
    if (!affiliateEarnings?.latest_referral_date) return 'no-referrals';
    
    const lastReferralDate = new Date(affiliateEarnings.latest_referral_date);
    const daysSinceLastReferral = Math.floor((new Date() - lastReferralDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastReferral <= 7) return 'active';
    if (daysSinceLastReferral <= 30) return 'moderate';
    return 'inactive';
  };

  // Tier-specific functions
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
      <div className="affiliate-dashboard-promotion-alert">
        <div className="affiliate-dashboard-promotion-content">
          <Trophy size={24} />
          <div className="affiliate-dashboard-promotion-text">
            <strong>Congratulations! 🎉</strong>
            <p>
              You've been promoted from <strong>{latestPromotion.old_tier}</strong> to{' '}
              <strong>{latestPromotion.new_tier}</strong> Tier!
            </p>
            {latestPromotion.new_tier === 'Gold' && (
              <p className="affiliate-dashboard-gold-message">
                <strong>🎁 Special Reward:</strong> As a Gold Tier affiliate, you'll receive monthly gifts!
              </p>
            )}
          </div>
          <button 
            onClick={() => affiliateData && markNotificationsAsRead(affiliateData.id)}
            className="affiliate-dashboard-promotion-dismiss"
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
      <div className="affiliate-dashboard-tier-progress-section">
        <div className="affiliate-dashboard-tier-progress-header">
          <h4>
            {getTierIcon(tierInfo?.tier_name || 'Starter')}
            <span>{tierInfo?.tier_name || 'Starter'} Tier</span>
          </h4>
          <span className="affiliate-dashboard-tier-badge" style={{ backgroundColor: tierInfo?.tier_color || 'blue' }}>
            {tierInfo?.tier_icon || '🚀'} {tierInfo?.tier_name || 'Starter'}
          </span>
        </div>
        
        {!tierProgress.is_max_tier ? (
          <div className="affiliate-dashboard-tier-progress-details">
            <div className="affiliate-dashboard-progress-info">
              <span className="affiliate-dashboard-current-amount">
                GH₵ {tierProgress.current_commission?.toFixed(2) || '0.00'}
              </span>
              <span className="affiliate-dashboard-progress-text">
                Progress to {tierProgress.next_tier}
              </span>
              <span className="affiliate-dashboard-needed-amount">
                Need GH₵ {tierProgress.needed_for_next?.toFixed(2) || '0.00'} more
              </span>
            </div>
            <div className="affiliate-dashboard-progress-bar-container">
              <div 
                className="affiliate-dashboard-progress-bar-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="affiliate-dashboard-tier-target">
              <span>Starter</span>
              <span>Bronze (GH₵ 500)</span>
              <span>Silver (GH₵ 1,000)</span>
              <span>Gold (GH₵ 5,000)</span>
            </div>
          </div>
        ) : (
          <div className="affiliate-dashboard-max-tier-message">
            <Trophy size={24} />
            <div>
              <strong>🏆 You've Reached the Highest Tier!</strong>
              <p>You're a Gold Tier affiliate! You'll receive monthly gifts and premium support.</p>
            </div>
          </div>
        )}

        {tierInfo?.tier_benefits && (
          <div className="affiliate-dashboard-tier-benefits">
            <h5>Tier Benefits:</h5>
            <p>{tierInfo.tier_benefits}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="affiliate-dashboard-container">
        <div className="affiliate-dashboard-loading-dashboard">
          <div className="affiliate-dashboard-loading-spinner"></div>
          <p>Loading your comprehensive affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="affiliate-dashboard-container">
        <div className="affiliate-dashboard-not-affiliate">
          <Gift size={64} />
          <h2>Become an Affiliate</h2>
          <p>Join our affiliate program to start earning commissions on referrals. Earn 5% on every successful referral!</p>
          <a href="/affiliates" className="affiliate-dashboard-btn affiliate-dashboard-btn-large">
            Join Affiliate Program
          </a>
        </div>
      </div>
    );
  }

  const referralTrend = getReferralTrend();

  return (
    <div className="affiliate-dashboard-container">
      <div className="affiliate-dashboard">
        {/* Header */}
        <div className="affiliate-dashboard-header">
          <div className="affiliate-dashboard-header-content">
            <h1>Affiliate Dashboard</h1>
            <p>Welcome back, {affiliateData.full_name}! Track your comprehensive earnings and performance.</p>
            {tierInfo && (
              <div className="affiliate-dashboard-performance-indicator">
                <span className="affiliate-dashboard-performance-tier-badge" style={{ backgroundColor: tierInfo.tier_color }}>
                  {tierInfo.tier_icon} {tierInfo.tier_name} Tier
                </span>
                <span className={`affiliate-dashboard-referral-trend ${referralTrend}`}>
                  {referralTrend === 'active' ? '🔥 Active' : referralTrend === 'moderate' ? '📊 Moderate' : '💤 Needs Activity'}
                </span>
              </div>
            )}
          </div>
          <div className="affiliate-dashboard-header-actions">
            <button onClick={refreshData} className="affiliate-dashboard-btn affiliate-dashboard-btn-secondary" disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'affiliate-dashboard-spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={shareAffiliateCode} className="affiliate-dashboard-btn affiliate-dashboard-btn-primary">
              <Share2 size={16} />
              Share Your Code
            </button>
          </div>
        </div>

        {/* Promotion Alert */}
        {showPromotionAlert && <PromotionAlert />}

        {/* Tier Progress Section */}
        {tierInfo && <TierProgressDisplay />}

        {/* Enhanced Affiliate Code Card */}
        <div className="affiliate-dashboard-code-card">
          <div className="affiliate-dashboard-code-content">
            <div className="affiliate-dashboard-code-info">
              <h3>Your Affiliate Code</h3>
              <p>Share this code with friends and earn 5% commission on their purchases</p>
              <div className="affiliate-dashboard-commission-info">
                <span className="affiliate-dashboard-commission-rate">5% Commission Rate</span>
                <span className="affiliate-dashboard-commission-note">• Lifetime tracking • Real-time updates</span>
              </div>
            </div>
            <div className="affiliate-dashboard-code-display">
              <span className="affiliate-dashboard-code">{affiliateData.affiliate_code}</span>
              <button 
                onClick={copyAffiliateCode}
                className={`affiliate-dashboard-copy-btn ${copied ? 'affiliate-dashboard-copied' : ''}`}
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
          {affiliateEarnings && (
            <div className="affiliate-dashboard-code-stats">
              <div className="affiliate-dashboard-stat-item">
                <Clock size={14} />
                <span>Active since {new Date(affiliateData.created_at).toLocaleDateString()}</span>
              </div>
              <div className="affiliate-dashboard-stat-item">
                {getTierIcon(tierInfo?.tier_name)}
                <span>{tierInfo?.tier_name || 'Starter'} Tier</span>
              </div>
              <div className="affiliate-dashboard-stat-item">
                <Target size={14} />
                <span>{affiliateEarnings.paid_referrals || 0} successful referrals</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Grid with Comprehensive Data */}
        <div className="affiliate-dashboard-stats-grid">
          <div className="affiliate-dashboard-stat-card">
            <div className="affiliate-dashboard-stat-icon affiliate-dashboard-primary">
              <Users size={24} />
            </div>
            <div className="affiliate-dashboard-stat-info">
              <h3>{stats.totalReferrals}</h3>
              <p>Total Referrals</p>
              <div className="affiliate-dashboard-stat-subtext">
                {affiliateEarnings?.paid_referrals || 0} successful • {affiliateEarnings?.pending_referrals || 0} pending
              </div>
            </div>
          </div>

          <div className="affiliate-dashboard-stat-card">
            <div className="affiliate-dashboard-stat-icon affiliate-dashboard-warning">
              <DollarSign size={24} />
            </div>
            <div className="affiliate-dashboard-stat-info">
              <h3>GH₵ {stats.pendingCommission.toFixed(2)}</h3>
              <p>Pending Commission</p>
              <div className="affiliate-dashboard-stat-subtext">
                Awaiting order completion
              </div>
            </div>
          </div>

          <div className="affiliate-dashboard-stat-card">
            <div className="affiliate-dashboard-stat-icon affiliate-dashboard-info">
              <ShoppingCart size={24} />
            </div>
            <div className="affiliate-dashboard-stat-info">
              <h3>GH₵ {stats.approvedCommission.toFixed(2)}</h3>
              <p>Ready for Payout</p>
              <div className="affiliate-dashboard-stat-subtext">
                Approved commissions
              </div>
            </div>
          </div>

          <div className="affiliate-dashboard-stat-card">
            <div className="affiliate-dashboard-stat-icon affiliate-dashboard-success">
              <Wallet size={24} />
            </div>
            <div className="affiliate-dashboard-stat-info">
              <h3>GH₵ {stats.totalCommission.toFixed(2)}</h3>
              <p>Total Paid Out</p>
              <div className="affiliate-dashboard-stat-subtext">
                Commission received
              </div>
            </div>
          </div>

          {/* Additional Stats from Earnings View */}
          {affiliateEarnings && (
            <>
              <div className="affiliate-dashboard-stat-card">
                <div className="affiliate-dashboard-stat-icon affiliate-dashboard-premium">
                  <BarChart3 size={24} />
                </div>
                <div className="affiliate-dashboard-stat-info">
                  <h3>GH₵ {stats.lifetimeEarnings.toFixed(2)}</h3>
                  <p>Lifetime Generated</p>
                  <div className="affiliate-dashboard-stat-subtext">
                    All-time commission value
                  </div>
                </div>
              </div>

              <div className="affiliate-dashboard-stat-card">
                <div className="affiliate-dashboard-stat-icon affiliate-dashboard-secondary">
                  <Target size={24} />
                </div>
                <div className="affiliate-dashboard-stat-info">
                  <h3>{stats.conversionRate}%</h3>
                  <p>Success Rate</p>
                  <div className="affiliate-dashboard-stat-subtext">
                    Referral conversion
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Performance Overview */}
        {affiliateEarnings && (
          <div className="affiliate-dashboard-performance-overview">
            <h3>Performance Overview</h3>
            <div className="affiliate-dashboard-performance-grid">
              <div className="affiliate-dashboard-performance-card">
                <div className="affiliate-dashboard-performance-title">Referral Performance</div>
                <div className="affiliate-dashboard-performance-stats">
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Total Referrals:</span>
                    <span className="affiliate-dashboard-value">{affiliateEarnings.lifetime_referrals || 0}</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Successful:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-success">{affiliateEarnings.paid_referrals || 0}</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Pending:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-warning">{affiliateEarnings.pending_referrals || 0}</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Cancelled:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-danger">{affiliateEarnings.cancelled_referrals || 0}</span>
                  </div>
                </div>
              </div>

              <div className="affiliate-dashboard-performance-card">
                <div className="affiliate-dashboard-performance-title">Earnings Breakdown</div>
                <div className="affiliate-dashboard-performance-stats">
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Lifetime Generated:</span>
                    <span className="affiliate-dashboard-value">GH₵ {(affiliateEarnings.lifetime_commission || 0).toFixed(2)}</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Total Paid Out:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-success">GH₵ {(affiliateEarnings.total_paid_commission || 0).toFixed(2)}</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Pending Payout:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-warning">GH₵ {(affiliateEarnings.pending_commission || 0).toFixed(2)}</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Verified Paid:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-info">GH₵ {(affiliateEarnings.verified_paid_commission || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="affiliate-dashboard-performance-card">
                <div className="affiliate-dashboard-performance-title">Tier & Activity</div>
                <div className="affiliate-dashboard-performance-stats">
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Performance Tier:</span>
                    <span className="affiliate-dashboard-value" style={{ color: tierInfo?.tier_color || 'blue' }}>
                      {tierInfo?.tier_name || 'Starter'}
                    </span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Last Referral:</span>
                    <span className="affiliate-dashboard-value">
                      {affiliateEarnings.latest_referral_date 
                        ? new Date(affiliateEarnings.latest_referral_date).toLocaleDateString()
                        : 'No referrals yet'
                      }
                    </span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Success Rate:</span>
                    <span className="affiliate-dashboard-value affiliate-dashboard-success">{stats.conversionRate}%</span>
                  </div>
                  <div className="affiliate-dashboard-performance-item">
                    <span className="affiliate-dashboard-label">Member Since:</span>
                    <span className="affiliate-dashboard-value">
                      {new Date(affiliateEarnings.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Range Filter */}
        <div className="affiliate-dashboard-time-filter-section">
          <div className="affiliate-dashboard-section-header">
            <div>
              <h3>Referral History</h3>
              <p className="affiliate-dashboard-filter-info">
                Showing {getFilteredReferralsCount()} of {stats.totalReferrals} total referrals {timeRange !== 'all' && `for ${getTimeRangeText().toLowerCase()}`}
              </p>
            </div>
            <div className="affiliate-dashboard-filter-options">
              <button 
                className={`affiliate-dashboard-filter-btn ${timeRange === 'week' ? 'affiliate-dashboard-active' : ''}`}
                onClick={() => setTimeRange('week')}
              >
                This Week
              </button>
              <button 
                className={`affiliate-dashboard-filter-btn ${timeRange === 'month' ? 'affiliate-dashboard-active' : ''}`}
                onClick={() => setTimeRange('month')}
              >
                This Month
              </button>
              <button 
                className={`affiliate-dashboard-filter-btn ${timeRange === 'all' ? 'affiliate-dashboard-active' : ''}`}
                onClick={() => setTimeRange('all')}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="affiliate-dashboard-referrals-section">
          {referrals.length === 0 ? (
            <div className="affiliate-dashboard-no-referrals">
              <Gift size={48} />
              <h3>No Referrals {timeRange !== 'all' ? `This ${timeRange === 'week' ? 'Week' : 'Month'}` : 'Yet'}</h3>
              <p>
                {timeRange !== 'all' 
                  ? `No referrals found for ${getTimeRangeText().toLowerCase()}. Try selecting "All Time" to see all your referrals.`
                  : 'Share your affiliate code to start earning commissions! When someone uses your code to make a purchase, it will appear here.'
                }
              </p>
              <button onClick={shareAffiliateCode} className="affiliate-dashboard-btn affiliate-dashboard-btn-primary">
                <Share2 size={16} />
                Share Your Code Now
              </button>
            </div>
          ) : (
            <div className="affiliate-dashboard-referrals-table-container">
              <div className="affiliate-dashboard-table-header">
                <div className="affiliate-dashboard-header-cell">Customer</div>
                <div className="affiliate-dashboard-header-cell">Order Amount</div>
                <div className="affiliate-dashboard-header-cell">Commission</div>
                <div className="affiliate-dashboard-header-cell">Date</div>
                <div className="affiliate-dashboard-header-cell">Status</div>
              </div>
              <div className="affiliate-dashboard-table-body">
                {referrals.map((referral) => (
                  <div key={referral.id} className="affiliate-dashboard-table-row">
                    <div className="affiliate-dashboard-table-cell affiliate-dashboard-customer-info">
                      <div className="affiliate-dashboard-customer-name">{referral.customer_name || 'Customer'}</div>
                      <div className="affiliate-dashboard-customer-email">{referral.customer_email}</div>
                    </div>
                    <div className="affiliate-dashboard-table-cell affiliate-dashboard-order-amount">
                      GH₵ {parseFloat(referral.order_amount || 0).toFixed(2)}
                    </div>
                    <div className="affiliate-dashboard-table-cell affiliate-dashboard-commission-info">
                      <div className="affiliate-dashboard-commission-amount">
                        GH₵ {parseFloat(referral.commission_amount || 0).toFixed(2)}
                      </div>
                      <div className="affiliate-dashboard-commission-percentage">
                        ({parseFloat(referral.commission_percentage || 5).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="affiliate-dashboard-table-cell affiliate-dashboard-referral-date">
                      <Calendar size={14} />
                      {new Date(referral.created_at).toLocaleDateString()}
                    </div>
                    <div className="affiliate-dashboard-table-cell affiliate-dashboard-status-cell">
                      {getStatusBadge(referral.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Help Section with Tier Focus */}
        <div className="affiliate-dashboard-help-section">
          <h3>🚀 Grow Your Earnings & Tier Up!</h3>
          <div className="affiliate-dashboard-help-tips">
            <div className="affiliate-dashboard-tip-card">
              <Zap size={24} />
              <div className="affiliate-dashboard-tip-content">
                <h4>Boost Your Tier Level</h4>
                <p>Reach higher tiers for exclusive benefits! Gold tier affiliates receive monthly gifts!</p>
                {tierProgress && !tierProgress.is_max_tier && (
                  <div className="affiliate-dashboard-tier-progress">
                    <div className="affiliate-dashboard-progress-bar">
                      <div 
                        className="affiliate-dashboard-progress-fill" 
                        style={{ 
                          width: `${tierProgress.progress_percentage || 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="affiliate-dashboard-progress-text">
                      GH₵ {tierProgress.current_commission?.toFixed(2) || '0.00'} / GH₵ {tierProgress.next_tier_min || '0.00'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="affiliate-dashboard-tip-card">
              <Share2 size={24} />
              <div className="affiliate-dashboard-tip-content">
                <h4>Share on Social Media</h4>
                <p>Post your code on Facebook, Twitter, Instagram, and WhatsApp groups. Share success stories!</p>
              </div>
            </div>
            <div className="affiliate-dashboard-tip-card">
              <Users size={24} />
              <div className="affiliate-dashboard-tip-content">
                <h4>Tell Friends & Family</h4>
                <p>Recommend specific products you love. Personal recommendations convert best!</p>
              </div>
            </div>
          </div>
          <div className="affiliate-dashboard-help-actions">
            <a 
              href="https://chat.whatsapp.com/IUdXjo4kmMvDkDqsyXPWxb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="affiliate-dashboard-btn affiliate-dashboard-btn-secondary"
            >
              Join WhatsApp Group
            </a>
            <button onClick={shareAffiliateCode} className="affiliate-dashboard-btn affiliate-dashboard-btn-primary">
              <Share2 size={16} />
              Share Code Now
            </button>
          </div>
        </div>

        {/* Enhanced Commission Explanation with Tier Benefits */}
        <div className="affiliate-dashboard-commission-guide">
          <h3>💰 How Commissions & Tiers Work</h3>
          <div className="affiliate-dashboard-commission-steps">
            <div className="affiliate-dashboard-step">
              <div className="affiliate-dashboard-step-number">1</div>
              <div className="affiliate-dashboard-step-content">
                <h4>Share Your Code</h4>
                <p>Share your unique affiliate code with potential customers</p>
              </div>
            </div>
            <div className="affiliate-dashboard-step">
              <div className="affiliate-dashboard-step-number">2</div>
              <div className="affiliate-dashboard-step-content">
                <h4>Customer Makes Purchase</h4>
                <p>Customer uses your code at checkout</p>
              </div>
            </div>
            <div className="affiliate-dashboard-step">
              <div className="affiliate-dashboard-step-number">3</div>
              <div className="affiliate-dashboard-step-content">
                <h4>Commission Tracked</h4>
                <p>Commission appears as "Pending" in your dashboard</p>
              </div>
            </div>
            <div className="affiliate-dashboard-step">
              <div className="affiliate-dashboard-step-number">4</div>
              <div className="affiliate-dashboard-step-content">
                <h4>Advance Tiers</h4>
                <p>Earn more to unlock higher tiers: Bronze, Silver, Gold</p>
              </div>
            </div>
            <div className="affiliate-dashboard-step">
              <div className="affiliate-dashboard-step-number">5</div>
              <div className="affiliate-dashboard-step-content">
                <h4>Get Rewards</h4>
                <p>Higher tiers bring monthly gifts and premium benefits</p>
              </div>
            </div>
          </div>
          <div className="affiliate-dashboard-commission-note">
            <p><strong>Tier Benefits:</strong> 
              {tierInfo?.tier_benefits ? ` ${tierInfo.tier_benefits}` : ' 5% commission rate, Basic tracking'}
              {tierInfo?.tier_name === 'Gold' && ' + Monthly gifts!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;