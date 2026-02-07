import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import '../App.css';
import '../styles/adminaffiliates.css';

import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BarChart3,
  Clock,
  Award,
  RefreshCw,
  AlertCircle,
  Ban,
  Check,
  Wifi,
  WifiOff,
  Database,
  Bug,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

const AdminAffiliates = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [affiliateEarnings, setAffiliateEarnings] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalCommission: 0,
    pendingPayouts: 0,
    lifetimeEarnings: 0,
    totalReferrals: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showAffiliateDetails, setShowAffiliateDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const subscriptionRef = useRef(null);
  const dataVersionRef = useRef(0);
  const [debugMode, setDebugMode] = useState(false);

  // Mobile specific states
  const [expandedAffiliateId, setExpandedAffiliateId] = useState(null);
  const [expandedReferralId, setExpandedReferralId] = useState(null);
  const [mobileView, setMobileView] = useState('affiliates');

  // Track last refresh time
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    if (user && isAdmin()) {
      loadAdminData();
      setupRealTimeSubscriptions();
    }
    
    return () => {
      cleanupSubscriptions();
    };
  }, [user, isAdmin]);

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  // Enhanced real-time subscription setup
  const setupRealTimeSubscriptions = () => {
    if (!user || !isAdmin()) {
      console.log('Cannot setup subscriptions: User not admin or not logged in');
      return;
    }

    console.log('🔄 Setting up real-time subscriptions...');
    
    cleanupSubscriptions();

    try {
      const channel = supabase.channel('admin-affiliates-dashboard', {
        config: {
          broadcast: { self: false },
          presence: { key: 'admin-affiliates' }
        }
      });

      const tables = ['affiliates', 'referrals', 'orders'];
      
      tables.forEach(table => {
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT, UPDATE, DELETE',
            schema: 'public',
            table: table
          },
          async (payload) => {
            console.log(`📡 Real-time update for ${table}:`, {
              event: payload.eventType,
              new: payload.new,
              old: payload.old,
              timestamp: new Date().toISOString()
            });
            
            setConnectionStatus('connected');
            dataVersionRef.current += 1;
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const tableName = table.charAt(0).toUpperCase() + table.slice(1);
              showNotification(`${tableName} updated - refreshing data...`, 'info', 2000);
            }
            
            setTimeout(() => {
              refreshData();
            }, 500);
          }
        );
      });

      channel
        .on('system', { event: 'channel_joined' }, () => {
          console.log('✅ Successfully subscribed to real-time updates');
          setConnectionStatus('connected');
          showNotification('Real-time updates connected', 'success', 3000);
        })
        .on('system', { event: 'channel_left' }, () => {
          console.log('❌ Disconnected from real-time updates');
          setConnectionStatus('disconnected');
        })
        .on('system', { event: 'channel_error' }, (error) => {
          console.error('❌ Real-time subscription error:', error);
          setConnectionStatus('error');
          showNotification('Real-time updates disconnected. Please refresh.', 'error', 5000);
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('error');
          } else {
            setConnectionStatus(status);
          }
        });

      subscriptionRef.current = channel;

    } catch (error) {
      console.error('❌ Failed to setup real-time subscriptions:', error);
      setConnectionStatus('error');
      showNotification('Failed to setup real-time updates. Data may be stale.', 'warning', 5000);
    }
  };

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, []);

  // Enhanced debug helper function
  const debugCommissionState = useCallback(() => {
    console.log('=== ENHANCED DEBUG COMMISSION STATE ===');
    console.log(`Total Affiliates: ${affiliates.length}`);
    console.log(`Total Referrals: ${referrals.length}`);
    console.log(`Total Orders: ${orders.length}`);
    
    console.log('\n=== DATABASE SUMMARY ===');
    affiliates.forEach((affiliate, index) => {
      console.log(`\nAffiliate ${index + 1}/${affiliates.length}: ${affiliate.full_name} (${affiliate.affiliate_code})`);
      console.log(`  Total Commission: GH₵ ${affiliate.total_commission}`);
      console.log(`  Pending Commission: GH₵ ${affiliate.pending_commission}`);
      console.log(`  Total Earnings: GH₵ ${(parseFloat(affiliate.total_commission || 0) + Math.max(0, parseFloat(affiliate.pending_commission || 0))).toFixed(2)}`);
      
      // Find affiliate's referrals
      const affiliateReferrals = referrals.filter(ref => ref.affiliate_id === affiliate.id);
      console.log(`  Actual Referrals Count: ${affiliateReferrals.length}`);
      
      // Calculate expected values
      const paidReferrals = affiliateReferrals.filter(r => r.status === 'paid');
      const approvedReferrals = affiliateReferrals.filter(r => r.status === 'approved');
      const pendingReferrals = affiliateReferrals.filter(r => r.status === 'pending');
      const cancelledReferrals = affiliateReferrals.filter(r => r.status === 'cancelled');
      
      const expectedPaid = paidReferrals.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
      const expectedPending = approvedReferrals.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
      const expectedCancelled = cancelledReferrals.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
      
      console.log(`  Expected Paid: GH₵ ${expectedPaid.toFixed(2)} (${paidReferrals.length} referrals)`);
      console.log(`  Expected Pending: GH₵ ${expectedPending.toFixed(2)} (${approvedReferrals.length} referrals)`);
      console.log(`  Expected Cancelled: GH₵ ${expectedCancelled.toFixed(2)} (${cancelledReferrals.length} referrals)`);
      console.log(`  Pending (awaiting approval): ${pendingReferrals.length} referrals`);
      
      // Discrepancy analysis
      const dbPaid = parseFloat(affiliate.total_commission || 0);
      const dbPending = parseFloat(affiliate.pending_commission || 0);
      
      if (Math.abs(dbPaid - expectedPaid) > 0.01) {
        console.error(`  ❌ PAID DISCREPANCY: Database (${dbPaid}) vs Expected (${expectedPaid}) = ${(dbPaid - expectedPaid).toFixed(2)}`);
      }
      
      if (dbPending < 0) {
        console.error(`  ❌ NEGATIVE PENDING: ${dbPending} (Should never be negative!)`);
      }
      
      if (Math.abs(dbPending - expectedPending) > 0.01) {
        console.error(`  ❌ PENDING DISCREPANCY: Database (${dbPending}) vs Expected (${expectedPending}) = ${(dbPending - expectedPending).toFixed(2)}`);
      }
    });
    
    console.log('\n=== REFERRAL STATUS BREAKDOWN ===');
    const statusGroups = {};
    referrals.forEach(ref => {
      if (!statusGroups[ref.status]) statusGroups[ref.status] = { count: 0, total: 0 };
      statusGroups[ref.status].count++;
      statusGroups[ref.status].total += parseFloat(ref.commission_amount || 0);
    });
    
    Object.entries(statusGroups).forEach(([status, data]) => {
      console.log(`${status}: ${data.count} referrals, GH₵ ${data.total.toFixed(2)}`);
    });
    
    console.log('\n=== STATS ===');
    console.log('Current Stats State:', stats);
    
    const realTotalAffiliates = affiliates.length;
    const realActiveAffiliates = affiliates.filter(a => a.is_active).length;
    const realTotalCommission = affiliates.reduce((sum, a) => sum + parseFloat(a.total_commission || 0), 0);
    const realPendingPayouts = affiliates.reduce((sum, a) => sum + Math.max(0, parseFloat(a.pending_commission || 0)), 0);
    const realLifetimeEarnings = realTotalCommission + realPendingPayouts;
    
    console.log('Real-time Calculations:');
    console.log(`  Total Affiliates: ${realTotalAffiliates} (stats: ${stats.totalAffiliates})`);
    console.log(`  Active Affiliates: ${realActiveAffiliates} (stats: ${stats.activeAffiliates})`);
    console.log(`  Total Commission: GH₵ ${realTotalCommission.toFixed(2)} (stats: GH₵ ${stats.totalCommission.toFixed(2)})`);
    console.log(`  Pending Payouts: GH₵ ${realPendingPayouts.toFixed(2)} (stats: GH₵ ${stats.pendingPayouts.toFixed(2)})`);
    console.log(`  Lifetime Earnings: GH₵ ${realLifetimeEarnings.toFixed(2)} (stats: GH₵ ${stats.lifetimeEarnings.toFixed(2)})`);
    console.log(`  Total Referrals: ${referrals.length} (stats: ${stats.totalReferrals})`);
    
    console.log('\n=== END DEBUG ===');
  }, [affiliates, referrals, orders, stats]);

  // Emergency fix for negative pending commission
  const fixNegativePendingCommission = async () => {
    try {
      showNotification('Fixing negative pending commissions...', 'warning');
      
      const { data: problematicAffiliates, error } = await supabase
        .from('affiliates')
        .select('id, full_name, pending_commission')
        .lt('pending_commission', 0);
      
      if (error) throw error;
      
      if (problematicAffiliates.length === 0) {
        showNotification('No negative pending commissions found', 'success');
        return;
      }
      
      console.log('Fixing negative pending commissions:', problematicAffiliates);
      
      for (const affiliate of problematicAffiliates) {
        const { error: updateError } = await supabase
          .from('affiliates')
          .update({ 
            pending_commission: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', affiliate.id);
        
        if (updateError) throw updateError;
        
        console.log(`Fixed ${affiliate.full_name}: ${affiliate.pending_commission} → 0`);
      }
      
      showNotification(`Fixed ${problematicAffiliates.length} negative pending commissions`, 'success');
      
      setTimeout(() => {
        refreshData();
      }, 1000);
      
    } catch (error) {
      console.error('Error fixing negative pending:', error);
      showNotification(`Error fixing commissions: ${error.message}`, 'error');
    }
  };

  // Improved data loading with better error handling
  const loadAdminData = async () => {
    const loadId = Date.now();
    console.log(`🔄 Loading admin data (ID: ${loadId})...`);
    
    setLoading(true);
    
    let simpleReferrals = [];
    
    try {
      const [affiliatesResult, earningsResult, referralsResult, ordersResult] = await Promise.all([
        supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_earnings_summary').select('*').order('lifetime_commission', { ascending: false }),
        supabase.from('referrals').select(`
          *,
          orders!fk_referrals_order_id (
            id,
            status,
            total_amount,
            customer_name,
            customer_email,
            created_at
          ),
          affiliates (
            full_name,
            affiliate_code,
            phone_number
          )
        `).order('created_at', { ascending: false }),
        supabase.from('orders').select('id, customer_name, total_amount, customer_email, affiliate_code, status, created_at').order('created_at', { ascending: false })
      ]);

      if (affiliatesResult.error) throw affiliatesResult.error;
      setAffiliates(affiliatesResult.data || []);
      console.log(`✅ Loaded ${affiliatesResult.data?.length || 0} affiliates`);

      if (earningsResult.error) {
        console.warn('Could not load earnings summary:', earningsResult.error);
        setAffiliateEarnings([]);
      } else {
        setAffiliateEarnings(earningsResult.data || []);
        console.log(`✅ Loaded ${earningsResult.data?.length || 0} earnings records`);
      }

      if (referralsResult.error) {
        console.error('Error loading referrals:', referralsResult.error);
        const { data: fallbackReferrals, error: simpleError } = await supabase
          .from('referrals')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (simpleError) throw simpleError;
        simpleReferrals = fallbackReferrals || [];
        setReferrals(simpleReferrals);
        console.log(`✅ Loaded ${simpleReferrals?.length || 0} referrals (fallback)`);
      } else {
        setReferrals(referralsResult.data || []);
        console.log(`✅ Loaded ${referralsResult.data?.length || 0} referrals`);
      }

      if (ordersResult.error) throw ordersResult.error;
      setOrders(ordersResult.data || []);
      console.log(`✅ Loaded ${ordersResult.data?.length || 0} orders`);

      const referralsData = referralsResult.data || simpleReferrals || [];
      calculateStats(
        affiliatesResult.data || [],
        referralsData,
        earningsResult.data || []
      );

      setLastRefresh(new Date().toISOString());
      console.log(`✅ Admin data loaded successfully (ID: ${loadId})`);
      
      if (debugMode) {
        debugCommissionState();
      }
      
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      showNotification(`Error loading affiliate data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Separate stats calculation for better performance
  const calculateStats = (affiliatesData, referralsData, earningsData) => {
    const totalAffiliates = affiliatesData.length;
    const activeAffiliates = affiliatesData.filter(a => a.is_active).length;
    
    // Use Math.max(0, pending_commission) to handle any negative values
    const totalPaidCommission = affiliatesData.reduce((sum, a) => 
      sum + parseFloat(a.total_commission || 0), 0);
    
    const pendingPayouts = affiliatesData.reduce((sum, a) => 
      sum + Math.max(0, parseFloat(a.pending_commission || 0)), 0);
    
    const lifetimeEarnings = totalPaidCommission + pendingPayouts;
    
    setStats({
      totalAffiliates,
      activeAffiliates,
      totalCommission: totalPaidCommission,
      pendingPayouts,
      lifetimeEarnings,
      totalReferrals: referralsData.length
    });
    
    console.log('📊 Stats calculated:', {
      totalAffiliates,
      activeAffiliates,
      totalPaidCommission,
      pendingPayouts,
      lifetimeEarnings,
      totalReferrals: referralsData.length
    });
  };

  const refreshData = async () => {
    if (refreshing) return;
    
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    showNotification('Refreshing data...', 'info', 2000);
    
    try {
      await loadAdminData();
      showNotification('Data refreshed successfully', 'success', 2000);
    } catch (error) {
      console.error('Refresh failed:', error);
      showNotification('Refresh failed. Please try again.', 'error');
    }
  };

  // Force refresh with subscription reconnection
  const forceRefresh = async () => {
    console.log('🔧 Force refresh with reconnection');
    showNotification('Force refreshing with reconnection...', 'warning', 3000);
    
    cleanupSubscriptions();
    setConnectionStatus('reconnecting');
    
    await loadAdminData();
    
    setTimeout(() => {
      setupRealTimeSubscriptions();
    }, 1000);
  };

  // Force refresh with debug
  const forceRefreshWithDebug = async () => {
    console.log('🔧 Force refresh with debug');
    showNotification('Force refreshing with debug...', 'warning', 3000);
    setDebugMode(true);
    await forceRefresh();
    setDebugMode(false);
  };

  // Helper function to get order info for a referral
  const getOrderInfoForReferral = useCallback((referral) => {
    if (referral.orders && Array.isArray(referral.orders) && referral.orders.length > 0) {
      return referral.orders[0];
    }
    
    if (referral.order_id) {
      const order = orders.find(o => o.id === referral.order_id);
      if (order) return order;
    }
    
    const order = orders.find(o => {
      if (o.customer_email && referral.customer_email && 
          o.customer_email.toLowerCase() === referral.customer_email.toLowerCase()) {
        return true;
      }
      
      if (o.customer_name && referral.customer_name && 
          o.customer_name.toLowerCase() === referral.customer_name.toLowerCase()) {
        return true;
      }
      
      if (o.affiliate_code && referral.affiliate_code && 
          o.affiliate_code === referral.affiliate_code) {
        return true;
      }
      
      return false;
    });
    
    return order || { 
      customer_name: referral.customer_name || 'N/A', 
      total_amount: referral.order_amount || 0,
      status: 'unknown'
    };
  }, [orders]);

  // Helper function to get order status for a referral
  const getOrderStatusForReferral = useCallback((referral) => {
    const orderInfo = getOrderInfoForReferral(referral);
    return orderInfo.status || 'unknown';
  }, [getOrderInfoForReferral]);

  // Helper to get comprehensive earnings for an affiliate
  const getAffiliateEarnings = useCallback((affiliateId) => {
    return affiliateEarnings.find(earning => earning.affiliate_id === affiliateId) || {};
  }, [affiliateEarnings]);

  // Get affiliate by ID
  const getAffiliateById = useCallback((affiliateId) => {
    return affiliates.find(a => a.id === affiliateId);
  }, [affiliates]);

  // Mobile toggle functions
  const toggleAffiliateExpansion = (affiliateId) => {
    setExpandedAffiliateId(expandedAffiliateId === affiliateId ? null : affiliateId);
  };

  const toggleReferralExpansion = (referralId) => {
    setExpandedReferralId(expandedReferralId === referralId ? null : referralId);
  };

  // FIXED: updateReferralStatus function
  const updateReferralStatus = async (referralId, newStatus) => {
    try {
      console.log(`Updating referral ${referralId} to ${newStatus}`);
      
      const { data: referral, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (fetchError) throw fetchError;

      const updateData = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        updateData.commission_added_to_pending = true;
        updateData.approved_at = new Date().toISOString();
        
        const affiliate = getAffiliateById(referral.affiliate_id);
        if (affiliate && !referral.commission_added_to_pending) {
          const commissionAmount = parseFloat(referral.commission_amount || 0);
          const currentPendingCommission = parseFloat(affiliate.pending_commission || 0);
          
          // Use Math.max(0, currentPendingCommission) to fix any existing negatives
          const newPendingCommission = Math.max(0, currentPendingCommission) + commissionAmount;
          
          console.log('Approval Debug:', {
            commissionAmount,
            currentPendingCommission,
            newPendingCommission
          });
          
          const { error: affiliateError } = await supabase
            .from('affiliates')
            .update({ 
              pending_commission: newPendingCommission,
              updated_at: new Date().toISOString()
            })
            .eq('id', referral.affiliate_id);

          if (affiliateError) throw affiliateError;
        }
      }

      const { error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referralId);

      if (error) throw error;

      showNotification(`Referral ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`, 'success');
      
      setTimeout(() => {
        refreshData();
      }, 500);
      
    } catch (error) {
      console.error('Error updating referral status:', error);
      showNotification(`Error updating referral: ${error.message}`, 'error');
    }
  };

  // FIXED: cancelReferral function
  const cancelReferral = async (referralId) => {
    try {
      console.log(`Cancelling referral ${referralId}`);
      
      const { data: referral, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (fetchError) throw fetchError;

      const updateData = { 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        commission_reversed: true,
        commission_reversed_at: new Date().toISOString()
      };

      if (referral.commission_paid || referral.commission_added_to_pending) {
        const affiliate = getAffiliateById(referral.affiliate_id);
        if (affiliate) {
          let updates = { updated_at: new Date().toISOString() };
          
          const commissionAmount = parseFloat(referral.commission_amount || 0);
          const currentTotalCommission = parseFloat(affiliate.total_commission || 0);
          const currentPendingCommission = parseFloat(affiliate.pending_commission || 0);
          
          console.log('Cancellation Debug:', {
            commissionAmount,
            currentTotalCommission,
            currentPendingCommission,
            commission_paid: referral.commission_paid,
            commission_added_to_pending: referral.commission_added_to_pending
          });
          
          // CRITICAL FIX: Only subtract from the correct field based on referral status
          if (referral.commission_paid) {
            // If commission was paid, reverse from total_commission
            updates.total_commission = Math.max(0, currentTotalCommission - commissionAmount);
            console.log(`Updating total_commission from ${currentTotalCommission} to ${updates.total_commission}`);
          } else if (referral.commission_added_to_pending) {
            // If commission was only added to pending (approved but not paid), reverse from pending_commission
            updates.pending_commission = Math.max(0, currentPendingCommission - commissionAmount);
            console.log(`Updating pending_commission from ${currentPendingCommission} to ${updates.pending_commission}`);
          }
          
          // Final safety check
          if (updates.pending_commission !== undefined && updates.pending_commission < 0) {
            console.error('ERROR: Pending commission would be negative! Resetting to 0');
            updates.pending_commission = 0;
          }
          
          if (updates.total_commission !== undefined && updates.total_commission < 0) {
            console.error('ERROR: Total commission would be negative! Resetting to 0');
            updates.total_commission = 0;
          }
          
          const { error: affiliateError } = await supabase
            .from('affiliates')
            .update(updates)
            .eq('id', referral.affiliate_id);

          if (affiliateError) throw affiliateError;
        }
      }

      const { error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referralId);

      if (error) throw error;

      showNotification('Referral cancelled and commission reversed', 'warning');
      
      setTimeout(() => {
        refreshData();
      }, 500);
      
    } catch (error) {
      console.error('Error cancelling referral:', error);
      showNotification(`Error cancelling referral: ${error.message}`, 'error');
    }
  };

  // FIXED: manualPayoutReferral function
  const manualPayoutReferral = async (referralId) => {
    try {
      const { data: referral, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (fetchError) throw fetchError;

      const orderStatus = getOrderStatusForReferral(referral);
      if (orderStatus !== 'completed') {
        showNotification('Cannot pay commission: Order is not completed yet', 'error');
        return;
      }

      if (referral.commission_paid) {
        showNotification('Commission already paid', 'warning');
        return;
      }

      const { error } = await supabase
        .from('referrals')
        .update({
          status: 'paid',
          commission_paid: true,
          commission_paid_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (error) throw error;

      const affiliate = getAffiliateById(referral.affiliate_id);
      if (affiliate) {
        const commissionAmount = parseFloat(referral.commission_amount || 0);
        const currentTotalCommission = parseFloat(affiliate.total_commission || 0);
        const currentPendingCommission = parseFloat(affiliate.pending_commission || 0);
        
        const newTotalCommission = currentTotalCommission + commissionAmount;
        
        // CRITICAL FIX: Only subtract from pending if this referral was in pending
        let newPendingCommission = currentPendingCommission;
        if (referral.commission_added_to_pending) {
          newPendingCommission = Math.max(0, currentPendingCommission - commissionAmount);
        }
        
        console.log('Payout Debug:', {
          commissionAmount,
          currentTotalCommission,
          currentPendingCommission,
          newTotalCommission,
          newPendingCommission,
          commission_added_to_pending: referral.commission_added_to_pending
        });
        
        const { error: affiliateError } = await supabase
          .from('affiliates')
          .update({ 
            total_commission: newTotalCommission,
            pending_commission: newPendingCommission,
            updated_at: new Date().toISOString()
          })
          .eq('id', referral.affiliate_id);

        if (affiliateError) throw affiliateError;
      }

      showNotification('Commission paid manually', 'success');
      
      setTimeout(() => {
        refreshData();
      }, 500);
      
    } catch (error) {
      console.error('Error paying referral:', error);
      showNotification(`Error paying commission: ${error.message}`, 'error');
    }
  };

  const toggleAffiliateStatus = async (affiliateId, currentStatus) => {
    try {
      console.log(`Toggling affiliate ${affiliateId} status to ${!currentStatus}`);
      
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', affiliateId);

      if (error) throw error;

      showNotification(`Affiliate ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      showNotification(`Error updating status: ${error.message}`, 'error');
    }
  };

  const viewAffiliateDetails = (affiliate) => {
    const earnings = getAffiliateEarnings(affiliate.id);
    setSelectedAffiliate({ ...affiliate, ...earnings });
    setShowAffiliateDetails(true);
  };

  const closeAffiliateDetails = () => {
    setShowAffiliateDetails(false);
    setSelectedAffiliate(null);
  };

  // Filter affiliates based on search and status
  const filteredAffiliates = affiliateEarnings.filter(earning => {
    const affiliate = affiliates.find(a => a.id === earning.affiliate_id);
    if (!affiliate) return false;

    const matchesSearch = 
      (earning.full_name && earning.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (earning.affiliate_code && earning.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (affiliate.phone_number && affiliate.phone_number.includes(searchTerm)) ||
      (earning.location && earning.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && earning.is_active) ||
      (statusFilter === 'inactive' && !earning.is_active);

    return matchesSearch && matchesStatus;
  });

  // Filter referrals
  const filteredReferrals = referrals.filter(referral => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active' || statusFilter === 'inactive') return true;
    return referral.status === statusFilter;
  });

  const getStatusBadge = (status, orderStatus = null) => {
    const statusConfig = {
      pending: { color: 'orange', label: 'Pending', icon: '⏳' },
      approved: { color: 'green', label: 'Approved', icon: '✅' },
      paid: { color: 'blue', label: 'Paid', icon: '💰' },
      cancelled: { color: 'red', label: 'Cancelled', icon: '❌' }
    };
    
    const config = statusConfig[status] || { color: 'gray', label: status, icon: '❓' };
    
    let orderInfo = '';
    if (orderStatus && orderStatus !== 'unknown') {
      const orderStatusConfig = {
        pending: '⏳',
        processing: '⚙️',
        shipped: '🚚',
        delivered: '📦',
        completed: '✅',
        cancelled: '❌'
      };
      orderInfo = ` (Order: ${orderStatusConfig[orderStatus] || orderStatus})`;
    }
    
    return (
      <span className={`status-badge ${config.color}`}>
        {config.icon} {config.label}{orderInfo}
      </span>
    );
  };

  const exportAffiliateData = () => {
    const csvContent = [
      ['Name', 'Code', 'Phone', 'Location', 'Status', 'Total Referrals', 'Paid Referrals', 'Pending Referrals', 'Paid Commission', 'Pending Commission', 'Lifetime Earnings', 'Join Date', 'Last Referral'],
      ...affiliates.map(affiliate => {
        const earnings = getAffiliateEarnings(affiliate.id);
        return [
          affiliate.full_name || 'N/A',
          affiliate.affiliate_code || 'N/A',
          affiliate.phone_number || 'N/A',
          affiliate.location || 'N/A',
          affiliate.is_active ? 'Active' : 'Inactive',
          earnings.lifetime_referrals || 0,
          earnings.paid_referrals || 0,
          earnings.pending_referrals || 0,
          `GH₵ ${(affiliate.total_commission || 0).toFixed(2)}`,
          `GH₵ ${Math.max(0, parseFloat(affiliate.pending_commission || 0)).toFixed(2)}`,
          `GH₵ ${(parseFloat(affiliate.total_commission || 0) + Math.max(0, parseFloat(affiliate.pending_commission || 0))).toFixed(2)}`,
          affiliate.created_at ? new Date(affiliate.created_at).toLocaleDateString() : 'N/A',
          earnings.latest_referral_date ? new Date(earnings.latest_referral_date).toLocaleDateString() : 'Never'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deetech-affiliates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Affiliate data exported successfully', 'success');
  };

  const getPerformanceTier = (lifetimeCommission) => {
    const commission = parseFloat(lifetimeCommission || 0);
    if (commission >= 5000) return { tier: 'Gold', color: 'gold' };
    if (commission >= 1000) return { tier: 'Silver', color: 'silver' };
    if (commission >= 500) return { tier: 'Bronze', color: 'bronze' };
    return { tier: 'Starter', color: 'gray' };
  };

  // Get commission tracking info for referral
  const getCommissionTrackingInfo = useCallback((referral) => {
    const orderStatus = getOrderStatusForReferral(referral);
    
    if (referral.commission_paid) {
      return '💰 Paid (Order Completed)';
    } else if (referral.commission_added_to_pending) {
      return '✅ Approved (Pending Order Completion)';
    } else if (referral.commission_reversed) {
      return '❌ Reversed';
    } else if (orderStatus === 'completed' && !referral.commission_paid) {
      return '⚠️ Ready to Pay (Order Completed)';
    }
    return `📊 ${referral.status === 'pending' ? 'Pending Approval' : 'Tracking'}`;
  }, [getOrderStatusForReferral]);

  // Check if a referral can be paid (order must be completed)
  const canPayReferral = useCallback((referral) => {
    const orderStatus = getOrderStatusForReferral(referral);
    return orderStatus === 'completed' && 
           referral.status === 'approved' && 
           !referral.commission_paid;
  }, [getOrderStatusForReferral]);

  // Mobile View Components
  const MobileStatsCards = () => (
    <div className="mobile-stats-grid">
      <div className="mobile-stat-card">
        <Users size={20} />
        <div className="mobile-stat-content">
          <div className="mobile-stat-value">{stats.totalAffiliates}</div>
          <div className="mobile-stat-label">Affiliates</div>
        </div>
      </div>
      
      <div className="mobile-stat-card">
        <BarChart3 size={20} />
        <div className="mobile-stat-content">
          <div className="mobile-stat-value">{stats.totalReferrals}</div>
          <div className="mobile-stat-label">Referrals</div>
        </div>
      </div>
      
      <div className="mobile-stat-card">
        <TrendingUp size={20} />
        <div className="mobile-stat-content">
          <div className="mobile-stat-value">GH₵ {stats.lifetimeEarnings.toFixed(0)}</div>
          <div className="mobile-stat-label">Generated</div>
        </div>
      </div>
      
      <div className="mobile-stat-card">
        <DollarSign size={20} />
        <div className="mobile-stat-content">
          <div className="mobile-stat-value">GH₵ {stats.pendingPayouts.toFixed(0)}</div>
          <div className="mobile-stat-label">Pending</div>
        </div>
      </div>
    </div>
  );

  const MobileAffiliatesList = () => (
    <div className="mobile-section">
      <div className="mobile-section-header">
        <h3>Affiliates ({affiliates.length})</h3>
        <button 
          className="btn btn-small"
          onClick={exportAffiliateData}
        >
          <Download size={14} />
          Export
        </button>
      </div>
      
      <div className="mobile-search-filter">
        <div className="mobile-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search affiliates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mobile-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      
      <div className="mobile-affiliates-list">
        {affiliates.map((affiliate) => {
          const earnings = getAffiliateEarnings(affiliate.id);
          const performanceTier = getPerformanceTier((affiliate.total_commission || 0) + Math.max(0, parseFloat(affiliate.pending_commission || 0)));
          const isExpanded = expandedAffiliateId === affiliate.id;
          
          return (
            <div key={affiliate.id} className="mobile-affiliate-card">
              <div 
                className="mobile-affiliate-header"
                onClick={() => toggleAffiliateExpansion(affiliate.id)}
              >
                <div className="mobile-affiliate-info">
                  <div className="mobile-affiliate-name">{affiliate.full_name || 'Unknown'}</div>
                  <div className="mobile-affiliate-code">{affiliate.affiliate_code || 'N/A'}</div>
                  <div className="mobile-affiliate-location">
                    <MapPin size={12} />
                    {affiliate.location || 'Unknown'}
                  </div>
                </div>
                <div className="mobile-affiliate-stats">
                  <span className="mobile-affiliate-earnings">
                    GH₵ {(parseFloat(affiliate.total_commission || 0) + Math.max(0, parseFloat(affiliate.pending_commission || 0))).toFixed(0)}
                  </span>
                  <div className="mobile-expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>
              
              <div className="mobile-affiliate-status">
                <span className={`mobile-status-badge ${affiliate.is_active ? 'active' : 'inactive'}`}>
                  {affiliate.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="mobile-performance-tier">
                  <Award size={12} />
                  {performanceTier.tier}
                </div>
              </div>
              
              {isExpanded && (
                <div className="mobile-affiliate-details">
                  <div className="mobile-detail-row">
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Phone</span>
                      <span className="mobile-detail-value">{affiliate.phone_number || 'N/A'}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Join Date</span>
                      <span className="mobile-detail-value">
                        {affiliate.created_at ? new Date(affiliate.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-detail-row">
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Total Referrals</span>
                      <span className="mobile-detail-value">{earnings.lifetime_referrals || 0}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Paid Commission</span>
                      <span className="mobile-detail-value">
                        GH₵ {(affiliate.total_commission || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-detail-row">
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Pending Commission</span>
                      <span className="mobile-detail-value pending">
                        GH₵ {Math.max(0, parseFloat(affiliate.pending_commission || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-affiliate-actions">
                    <button
                      onClick={() => viewAffiliateDetails(affiliate)}
                      className="mobile-action-btn"
                    >
                      <Eye size={14} />
                      Details
                    </button>
                    <button
                      onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.is_active)}
                      className={`mobile-action-btn ${affiliate.is_active ? 'danger' : 'success'}`}
                    >
                      {affiliate.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {affiliate.phone_number && (
                      <a
                        href={`https://wa.me/${affiliate.phone_number.replace('+', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mobile-action-btn whatsapp"
                      >
                        <Mail size={14} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {affiliates.length === 0 && (
          <div className="mobile-empty-state">
            <Users size={48} />
            <p>No affiliates found</p>
          </div>
        )}
      </div>
    </div>
  );

  const MobileReferralsList = () => (
    <div className="mobile-section">
      <div className="mobile-section-header">
        <h3>Referrals ({filteredReferrals.length})</h3>
      </div>
      
      <div className="mobile-search-filter">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mobile-filter"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      <div className="mobile-referrals-list">
        {filteredReferrals.map((referral) => {
          const orderInfo = getOrderInfoForReferral(referral);
          const orderStatus = getOrderStatusForReferral(referral);
          const canPay = canPayReferral(referral);
          const isExpanded = expandedReferralId === referral.id;
          
          return (
            <div key={referral.id} className="mobile-referral-card">
              <div 
                className="mobile-referral-header"
                onClick={() => toggleReferralExpansion(referral.id)}
              >
                <div className="mobile-referral-info">
                  <div className="mobile-referral-customer">
                    {referral.customer_name || referral.customer_email || 'Unknown Customer'}
                  </div>
                  <div className="mobile-referral-affiliate">
                    Via: {referral.affiliates?.full_name || 'Unknown Affiliate'}
                  </div>
                </div>
                <div className="mobile-referral-stats">
                  <span className="mobile-referral-amount">
                    GH₵ {parseFloat(referral.commission_amount || 0).toFixed(2)}
                  </span>
                  <div className="mobile-expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>
              
              <div className="mobile-referral-meta">
                <span className={`mobile-referral-status ${referral.status}`}>
                  {referral.status}
                </span>
                <span className="mobile-referral-date">
                  {new Date(referral.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {isExpanded && (
                <div className="mobile-referral-details">
                  <div className="mobile-detail-row">
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Affiliate Code</span>
                      <span className="mobile-detail-value">{referral.affiliate_code || 'N/A'}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Order Status</span>
                      <span className="mobile-detail-value">
                        {orderStatus ? orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-detail-row">
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Commission</span>
                      <span className="mobile-detail-value">
                        GH₵ {parseFloat(referral.commission_amount || 0).toFixed(2)} ({referral.commission_percentage || 5}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-detail-row">
                    <div className="mobile-detail-item full-width">
                      <span className="mobile-detail-label">Tracking Status</span>
                      <span className="mobile-detail-value">
                        {getCommissionTrackingInfo(referral)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-referral-actions">
                    {referral.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReferralStatus(referral.id, 'approved')}
                          className="mobile-action-btn success"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => cancelReferral(referral.id)}
                          className="mobile-action-btn danger"
                        >
                          <Ban size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    
                    {referral.status === 'approved' && canPay && (
                      <button
                        onClick={() => manualPayoutReferral(referral.id)}
                        className="mobile-action-btn primary"
                      >
                        💰
                        Pay Now
                      </button>
                    )}
                    
                    {referral.status === 'approved' && !canPay && (
                      <button
                        onClick={() => cancelReferral(referral.id)}
                        className="mobile-action-btn danger"
                        disabled={orderStatus === 'completed'}
                      >
                        <XCircle size={14} />
                        Cancel
                      </button>
                    )}
                    
                    {referral.status === 'paid' && (
                      <span className="mobile-paid-badge">
                        Paid {referral.paid_at ? new Date(referral.paid_at).toLocaleDateString() : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredReferrals.length === 0 && (
          <div className="mobile-empty-state">
            <TrendingUp size={48} />
            <p>No referrals found</p>
          </div>
        )}
      </div>
    </div>
  );

  const MobileViewToggle = () => (
    <div className="mobile-view-toggle">
      <button
        className={`mobile-view-btn ${mobileView === 'affiliates' ? 'active' : ''}`}
        onClick={() => setMobileView('affiliates')}
      >
        <Users size={16} />
        Affiliates
      </button>
      <button
        className={`mobile-view-btn ${mobileView === 'referrals' ? 'active' : ''}`}
        onClick={() => setMobileView('referrals')}
      >
        <TrendingUp size={16} />
        Referrals
      </button>
    </div>
  );

  if (!user || !isAdmin()) {
    return (
      <div className="container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin affiliate panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-admin">
          <div className="loading-spinner"></div>
          <p>Loading comprehensive affiliate management panel...</p>
          <small>Data version: {dataVersionRef.current}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-affiliates">
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="notification-close">
              ×
            </button>
          </div>
        )}

        <div className="admin-header">
          <div className="header-content">
            <h1>Affiliate Management</h1>
            <p>Comprehensive affiliate tracking with accurate commission calculations</p>
            
            <div className="status-bar">
              <div className={`connection-status ${connectionStatus}`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi size={14} />
                    <span>Real-time updates active</span>
                  </>
                ) : connectionStatus === 'disconnected' ? (
                  <>
                    <WifiOff size={14} />
                    <span>Updates paused</span>
                  </>
                ) : (
                  <>
                    <Database size={14} />
                    <span>Connecting...</span>
                  </>
                )}
              </div>
              
              {lastRefresh && (
                <div className="last-refresh">
                  <Clock size={12} />
                  <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
                </div>
              )}
              
              <div className="commission-info-banner">
                <AlertCircle size={16} />
                <span>Commissions are automatically paid when orders are marked as "completed".</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button onClick={refreshData} className="btn btn-secondary" disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            
            <button onClick={forceRefresh} className="btn btn-warning" disabled={refreshing}>
              <Database size={16} />
              Force Refresh
            </button>
            
            <button 
              onClick={forceRefreshWithDebug}
              className="btn btn-danger"
              disabled={refreshing}
              title="Force refresh with debug logging"
            >
              <Bug size={16} />
              Debug Refresh
            </button>
            
            <button 
              onClick={debugCommissionState}
              className="btn btn-info"
              title="Debug current state"
            >
              <Database size={16} />
              Debug State
            </button>
            
            <button 
              onClick={fixNegativePendingCommission}
              className="btn btn-danger"
              title="Fix negative pending commissions"
            >
              ⚠️ Fix Negative Pending
            </button>
            
            <button onClick={exportAffiliateData} className="btn btn-primary">
              <Download size={16} />
              Export Data
            </button>
          </div>
        </div>

        {/* Mobile Stats and View - Only visible on mobile */}
        <div className="mobile-admin-section">
          <MobileStatsCards />
          <MobileViewToggle />
          {mobileView === 'affiliates' ? <MobileAffiliatesList /> : <MobileReferralsList />}
        </div>

        {/* Enhanced Stats Overview - Desktop */}
        <div className="admin-stats-grid desktop-only">
          <div className="admin-stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalAffiliates}</h3>
              <p>Total Affiliates</p>
              <div className="stat-subtext">
                {stats.activeAffiliates} active • {stats.totalAffiliates - stats.activeAffiliates} inactive
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalReferrals}</h3>
              <p>Total Referrals</p>
              <div className="stat-subtext">
                Lifetime conversions
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>GH₵ {stats.lifetimeEarnings.toFixed(2)}</h3>
              <p>Lifetime Generated</p>
              <div className="stat-subtext">
                All-time commission value
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon pending">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <h3>GH₵ {stats.pendingPayouts.toFixed(2)}</h3>
              <p>Pending Payouts</p>
              <div className="stat-subtext">
                Ready for payment
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-info">
              <h3>GH₵ {stats.totalCommission.toFixed(2)}</h3>
              <p>Total Paid Out</p>
              <div className="stat-subtext">
                Commission distributed
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Desktop */}
        <div className="admin-controls desktop-only">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search affiliates by name, code, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <Filter size={16} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="pending">Pending Referrals</option>
              <option value="approved">Approved Referrals</option>
              <option value="paid">Paid Referrals</option>
              <option value="cancelled">Cancelled Referrals</option>
            </select>
          </div>
        </div>

        {/* Enhanced Affiliates Table - Desktop */}
        <div className="admin-section desktop-only">
          <h2>Affiliates Performance ({affiliates.length})</h2>
          
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Performance Tier</th>
                  <th>Referral Stats</th>
                  <th>Earnings Summary</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => {
                  const earnings = getAffiliateEarnings(affiliate.id);
                  const performanceTier = getPerformanceTier((affiliate.total_commission || 0) + Math.max(0, parseFloat(affiliate.pending_commission || 0)));
                  const affiliateReferrals = referrals.filter(ref => ref.affiliate_id === affiliate.id);
                  
                  return (
                    <tr key={affiliate.id}>
                      <td>
                        <div className="affiliate-info">
                          <div className="affiliate-name">{affiliate.full_name || 'Unknown'}</div>
                          <div className="affiliate-code">{affiliate.affiliate_code || 'N/A'}</div>
                          <div className="affiliate-location">
                            <MapPin size={12} />
                            {affiliate.location || 'Unknown'}
                          </div>
                          <div className="affiliate-phone">
                            <Phone size={12} />
                            {affiliate.phone_number || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`performance-tier ${performanceTier.color}`}>
                          <Award size={14} />
                          {performanceTier.tier}
                        </div>
                      </td>
                      <td>
                        <div className="performance-stats">
                          <div className="stat">
                            <span className="label">Total:</span>
                            <span className="value">{affiliateReferrals.length}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Paid:</span>
                            <span className="value">{affiliateReferrals.filter(ref => ref.status === 'paid').length}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Pending:</span>
                            <span className="value">{affiliateReferrals.filter(ref => ref.status === 'pending' || ref.status === 'approved').length}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="earnings-summary">
                          <div className="earning-item">
                            <span className="label">Total:</span>
                            <span className="value">GH₵ {(parseFloat(affiliate.total_commission || 0) + Math.max(0, parseFloat(affiliate.pending_commission || 0))).toFixed(2)}</span>
                          </div>
                          <div className="earning-item">
                            <span className="label">Paid:</span>
                            <span className="value paid">GH₵ {(affiliate.total_commission || 0).toFixed(2)}</span>
                          </div>
                          <div className="earning-item">
                            <span className="label">Pending:</span>
                            <span className="value pending">GH₵ {Math.max(0, parseFloat(affiliate.pending_commission || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${affiliate.is_active ? 'green' : 'gray'}`}>
                          {affiliate.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="last-activity">
                          {affiliate.created_at ? (
                            <>
                              <Calendar size={12} />
                              {new Date(affiliate.created_at).toLocaleDateString()}
                            </>
                          ) : (
                            <span className="no-activity">Unknown</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => viewAffiliateDetails(affiliate)}
                            className="btn-icon"
                            title="View Comprehensive Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.is_active)}
                            className={`btn-icon ${affiliate.is_active ? 'danger' : 'success'}`}
                            title={affiliate.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {affiliate.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                          {affiliate.phone_number && (
                            <a 
                              href={`https://wa.me/${affiliate.phone_number.replace('+', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon success"
                              title="Contact via WhatsApp"
                            >
                              <Mail size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {affiliates.length === 0 && (
              <div className="no-data">
                <Users size={48} />
                <p>No affiliates found</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Referrals Table - Desktop */}
        <div className="admin-section desktop-only">
          <h2>Referral Transactions ({filteredReferrals.length})</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Customer</th>
                  <th>Order Status</th>
                  <th>Commission</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((referral) => {
                  const orderInfo = getOrderInfoForReferral(referral);
                  const orderStatus = getOrderStatusForReferral(referral);
                  const canPay = canPayReferral(referral);
                  
                  return (
                    <tr key={referral.id}>
                      <td>
                        <div className="affiliate-ref">
                          <div className="name">{referral.affiliates?.full_name || 'Unknown'}</div>
                          <div className="code">{referral.affiliate_code || 'N/A'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="name">{referral.customer_name || 'N/A'}</div>
                          <div className="email">{referral.customer_email || 'No email'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="order-status-indicator">
                          <span className={`order-status ${orderStatus}`}>
                            {orderStatus ? orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1) : 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="commission">
                          <div className="amount">GH₵ {parseFloat(referral.commission_amount || 0).toFixed(2)}</div>
                          <div className="percentage">({referral.commission_percentage || 5}%)</div>
                        </div>
                      </td>
                      <td>
                        <div className="date">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(referral.status, orderStatus)}
                      </td>
                      <td>
                        <div className="commission-tracking">
                          {getCommissionTrackingInfo(referral)}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {referral.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateReferralStatus(referral.id, 'approved')}
                                className="btn-icon success"
                                title="Approve Commission"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => cancelReferral(referral.id)}
                                className="btn-icon danger"
                                title="Reject Referral"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                          
                          {referral.status === 'approved' && canPay && (
                            <button 
                              onClick={() => manualPayoutReferral(referral.id)}
                              className="btn-icon primary"
                              title="Pay Commission (Order Completed)"
                            >
                              💰
                            </button>
                          )}
                          
                          {referral.status === 'approved' && !canPay && (
                            <button 
                              onClick={() => cancelReferral(referral.id)}
                              className="btn-icon danger"
                              title="Cancel Referral"
                              disabled={orderStatus === 'completed'}
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                          
                          {referral.status === 'paid' && (
                            <span className="paid-badge">
                              Paid {referral.paid_at ? new Date(referral.paid_at).toLocaleDateString() : ''}
                            </span>
                          )}
                          
                          {referral.status === 'cancelled' && (
                            <span className="cancelled-badge">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredReferrals.length === 0 && (
              <div className="no-data">
                <TrendingUp size={48} />
                <p>No referrals found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Affiliate Details Modal */}
        {showAffiliateDetails && selectedAffiliate && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h3>Comprehensive Affiliate Details</h3>
                <button onClick={closeAffiliateDetails} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="affiliate-details-comprehensive">
                  <div className="detail-section">
                    <h4>Personal Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Full Name:</span>
                        <span className="value">{selectedAffiliate.full_name || 'Unknown'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Affiliate Code:</span>
                        <span className="value code">{selectedAffiliate.affiliate_code || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Phone Number:</span>
                        <span className="value">{selectedAffiliate.phone_number || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Location:</span>
                        <span className="value">{selectedAffiliate.location || 'Unknown'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Join Date:</span>
                        <span className="value">{selectedAffiliate.created_at ? new Date(selectedAffiliate.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Last Updated:</span>
                        <span className="value">{selectedAffiliate.updated_at ? new Date(selectedAffiliate.updated_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Performance Overview</h4>
                    <div className="stats-grid-detailed">
                      <div className="stat-card-detailed">
                        <div className="stat-title">Total Referrals</div>
                        <div className="stat-value">{referrals.filter(ref => ref.affiliate_id === selectedAffiliate.id).length}</div>
                        <div className="stat-breakdown">
                          <span>Paid: {referrals.filter(ref => ref.affiliate_id === selectedAffiliate.id && ref.status === 'paid').length}</span>
                          <span>Pending: {referrals.filter(ref => ref.affiliate_id === selectedAffiliate.id && (ref.status === 'pending' || ref.status === 'approved')).length}</span>
                        </div>
                      </div>
                      <div className="stat-card-detailed">
                        <div className="stat-title">Total Earnings</div>
                        <div className="stat-value">GH₵ {(parseFloat(selectedAffiliate.total_commission || 0) + Math.max(0, parseFloat(selectedAffiliate.pending_commission || 0))).toFixed(2)}</div>
                        <div className="stat-breakdown">
                          <span>Paid: GH₵ {(selectedAffiliate.total_commission || 0).toFixed(2)}</span>
                          <span>Pending: GH₵ {Math.max(0, parseFloat(selectedAffiliate.pending_commission || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="stat-card-detailed">
                        <div className="stat-title">Performance Tier</div>
                        <div className="stat-value">
                          <span className={`tier-badge ${getPerformanceTier((selectedAffiliate.total_commission || 0) + Math.max(0, parseFloat(selectedAffiliate.pending_commission || 0))).color}`}>
                            {getPerformanceTier((selectedAffiliate.total_commission || 0) + Math.max(0, parseFloat(selectedAffiliate.pending_commission || 0))).tier}
                          </span>
                        </div>
                        <div className="stat-breakdown">
                          <span>Status: {selectedAffiliate.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Recent Referrals</h4>
                    <div className="recent-referrals">
                      {referrals
                        .filter(ref => ref.affiliate_id === selectedAffiliate.id)
                        .slice(0, 5)
                        .map(referral => {
                          const orderStatus = getOrderStatusForReferral(referral);
                          return (
                            <div key={referral.id} className="referral-item">
                              <div className="referral-customer">{referral.customer_name || referral.customer_email || 'Unknown'}</div>
                              <div className="referral-amount">GH₵ {parseFloat(referral.commission_amount || 0).toFixed(2)}</div>
                              <div className={`referral-status ${referral.status}`}>
                                {getStatusBadge(referral.status, orderStatus)}
                              </div>
                              <div className="referral-tracking">
                                {getCommissionTrackingInfo(referral)}
                              </div>
                              <div className="referral-date">
                                {new Date(referral.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          );
                        })}
                      {referrals.filter(ref => ref.affiliate_id === selectedAffiliate.id).length === 0 && (
                        <div className="no-referrals">No referrals yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={closeAffiliateDetails} className="btn btn-secondary">
                  Close
                </button>
                {selectedAffiliate.phone_number && (
                  <a 
                    href={`https://wa.me/${selectedAffiliate.phone_number.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <Mail size={16} />
                    Contact via WhatsApp
                  </a>
                )}
                <button 
                  onClick={() => toggleAffiliateStatus(selectedAffiliate.id, selectedAffiliate.is_active)}
                  className={`btn ${selectedAffiliate.is_active ? 'btn-danger' : 'btn-success'}`}
                >
                  {selectedAffiliate.is_active ? 'Deactivate' : 'Activate'} Affiliate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAffiliates;