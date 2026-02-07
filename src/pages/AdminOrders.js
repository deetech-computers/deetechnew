import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { 
  ShoppingCart, Eye, RefreshCw, Search, AlertCircle, Database,
  CheckCircle, XCircle, DollarSign, User, Package, Truck, 
  Clock, Shield, Zap, Wifi, WifiOff, Ban, TrendingUp, TrendingDown
} from 'lucide-react';
import '../styles/AdminOrders.css';

const AdminOrders = ({ OrderDetailsModal, ConfirmationModal }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState({});
  const [notification, setNotification] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState({
    connected: false,
    enabled: false,
    error: null
  });
  const [expandedOrderId, setExpandedOrderId] = useState(null); // Add this line

  const orderStatuses = [
    'pending',
    'processing', 
    'shipped',
    'delivered',
    'completed',
    'cancelled'
  ];

  const statusColors = {
    pending: 'orange',
    processing: 'blue',
    shipped: 'purple',
    delivered: 'green',
    completed: 'green',
    cancelled: 'red'
  };

  const getCustomerInfo = (order) => {
    const name = order?.customer_name || order?.customerName || order?.guest_name || order?.guestName || order?.billing_name || order?.name || 'Guest Customer';
    const email = order?.customer_email || order?.customerEmail || order?.guest_email || order?.guestEmail || order?.billing_email || order?.email || '';
    const phone = order?.customer_phone || order?.customerPhone || order?.guest_phone || order?.guestPhone || order?.billing_phone || order?.phone || '';
    const isGuest = !order?.user_id && !order?.userId;

    return { name, email, phone, isGuest };
  };

  // Add this function
  const toggleCardExpansion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  useEffect(() => {
    const verifyAdminSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          showNotification('Admin session not detected. Please sign in again to view all orders.', 'warning', 6000);
        }
      } catch (error) {
        console.warn('Session check failed:', error);
      }
    };

    verifyAdminSession();
    loadOrders();
    setupRealtimeSubscription();
    
    return () => {
      const channel = supabase.channel('admin-orders');
      channel.unsubscribe();
    };
  }, []);

  const setupRealtimeSubscription = async () => {
    try {
      console.log('Setting up real-time subscription...');
      
      const channel = supabase
        .channel('admin-orders-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('🔔 Real-time order update:', payload);
            handleRealtimeUpdate(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'referrals'
          },
          (payload) => {
            console.log('🔔 Real-time referral update:', payload);
            handleRealtimeUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          setRealtimeStatus(prev => ({
            ...prev,
            connected: status === 'SUBSCRIBED',
            error: status === 'CHANNEL_ERROR' ? 'Connection error' : null
          }));
        });

      return channel;
      
    } catch (error) {
      console.error('Error setting up real-time:', error);
      setRealtimeStatus(prev => ({
        ...prev,
        connected: false,
        error: error.message
      }));
      return null;
    }
  };

  const handleRealtimeUpdate = useCallback((payload) => {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    
    if (table === 'orders') {
      setOrders(prevOrders => {
        let updatedOrders = [...prevOrders];
        
        switch (eventType) {
          case 'INSERT':
            updatedOrders.unshift({
              ...newRecord,
              referrals: []
            });
            showNotification(`New order #${newRecord.id} created`, 'info', 2000);
            break;
            
          case 'UPDATE':
            updatedOrders = updatedOrders.map(order => 
              order.id === newRecord.id 
                ? { ...order, ...newRecord }
                : order
            );
            // Reload to get fresh referral data
            loadOrders();
            break;
            
          case 'DELETE':
            updatedOrders = updatedOrders.filter(order => order.id !== oldRecord.id);
            showNotification(`Order #${oldRecord.id} deleted`, 'warning', 2000);
            break;
        }
        
        return updatedOrders;
      });
    }
  }, []);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, []);

  const debugCommissionState = useCallback(() => {
    console.log('=== DEBUG COMMISSION STATE ===');
    console.log('Real-time status:', realtimeStatus);
    console.log('Current orders state:', orders.length);
    
    orders.forEach((order, index) => {
      console.log(`\nOrder #${order.id} (${index + 1}/${orders.length}):`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: GH₵ ${order.total_amount}`);
      console.log(`  Affiliate Code: ${order.affiliate_code || 'None'}`);
      
      if (order.referrals && order.referrals.length > 0) {
        const ref = order.referrals[0];
        console.log(`  Referral:`);
        console.log(`    ID: ${ref.id}`);
        console.log(`    Status: ${ref.status}`);
        console.log(`    Amount: GH₵ ${ref.commission_amount}`);
        console.log(`    Paid: ${ref.commission_paid}`);
        console.log(`    Reversed: ${ref.commission_reversed}`);
        
        if (ref.affiliates) {
          console.log(`    Affiliate: ${ref.affiliates.full_name}`);
          console.log(`    Affiliate Code: ${ref.affiliates.affiliate_code}`);
          console.log(`    Affiliate Stats: Total: GH₵ ${ref.affiliates.total_commission}, Pending: GH₵ ${ref.affiliates.pending_commission}`);
        }
      } else {
        console.log('  No referrals found for this order');
      }
    });
  }, [orders, realtimeStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading orders...');

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          referrals (
            *,
            affiliates (
              id,
              full_name,
              affiliate_code,
              total_commission,
              pending_commission
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error loading orders:', ordersError);
        showNotification(`Error loading orders: ${ordersError.message}`, 'error');
        setOrders([]);
        return;
      }

      setOrders(ordersData || []);
      console.log(`✅ Loaded ${ordersData?.length || 0} orders`);

      if (debugMode) {
        debugCommissionState();
      }

    } catch (error) {
      console.error('💥 Error loading orders:', error);
      showNotification('Failed to load orders. Please try again.', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (updatingOrders[orderId]) {
      console.log(`⚠️ Already updating order ${orderId}, skipping`);
      return;
    }
    
    setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
    
    try {
      console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
      
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (!orderStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      // 1. Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      console.log('✅ Order status updated');

      // 2. Update referral status to match allowed values
      if (currentOrder.referrals && currentOrder.referrals.length > 0) {
        const referral = currentOrder.referrals[0];
        const referralStatus = newStatus === 'completed'
          ? 'paid'
          : newStatus === 'cancelled'
            ? 'cancelled'
            : (referral.status || 'pending');
        
        const { error: referralError } = await supabase
          .from('referrals')
          .update({ 
            status: referralStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', referral.id);

        if (referralError) {
          console.warn('Could not update referral status:', referralError);
          // Continue anyway - order update is more important
        } else {
          console.log('✅ Referral status updated to:', referralStatus);
        }
      }

      // Optimistic update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus, 
                updated_at: new Date().toISOString(),
                referrals: order.referrals?.map(ref => ({
                  ...ref,
                  status: newStatus === 'completed'
                    ? 'paid'
                    : newStatus === 'cancelled'
                      ? 'cancelled'
                      : (ref.status || 'pending'),
                  updated_at: new Date().toISOString()
                })) || []
              }
            : order
        )
      );

      showNotification(`Order #${orderId} updated to ${newStatus}`, 'success');
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      showNotification(`Failed to update order: ${error.message}`, 'error');
      // Reload to get fresh data
      await loadOrders();
    } finally {
      setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const approveAndPayCommission = async (referralId, orderId) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (error) throw error;

      // Update order to completed if it's not already
      await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      showNotification('Commission approved and paid', 'success');
      
      // Reload orders to reflect changes
      await loadOrders();
      
    } catch (error) {
      console.error('Error paying commission:', error);
      showNotification('Failed to pay commission', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const color = statusColors[status] || 'gray';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    const icons = {
      pending: <Clock size={12} />,
      processing: <Package size={12} />,
      shipped: <Truck size={12} />,
      delivered: <CheckCircle size={12} />,
      completed: <Shield size={12} />,
      cancelled: <XCircle size={12} />
    };
    
    return (
      <span className={`status-badge ${color}`}>
        {icons[status] || <Clock size={12} />}
        {label}
      </span>
    );
  };

  const getReferralStatusBadge = (referrals) => {
    if (!referrals || referrals.length === 0) return null;
    
    const ref = referrals[0];
    if (!ref.status || ref.status === 'cancelled') return null;
    
    const color = statusColors[ref.status === 'paid' ? 'completed' : ref.status] || 'gray';
    const icons = {
      pending: <Clock size={12} />,
      paid: <DollarSign size={12} />,
      cancelled: <XCircle size={12} />
    };
    
    return (
      <span className={`status-badge small ${color}`}>
        {icons[ref.status] || <Clock size={12} />}
        {ref.status === 'paid' ? 'Paid' : ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
      </span>
    );
  };

  const getAffiliateInfo = (referrals) => {
    if (!referrals || referrals.length === 0) {
      return { name: null, code: null, id: null };
    }
    
    const ref = referrals[0];
    const totalCommission = parseFloat(ref.affiliates?.total_commission || 0);
    const pendingCommission = parseFloat(ref.affiliates?.pending_commission || 0);
    
    return {
      id: ref.affiliate_id,
      name: ref.affiliates?.full_name || 'Unknown Affiliate',
      code: ref.affiliates?.affiliate_code || 'N/A',
      // We're not showing these totals anymore for each order
      totalCommission: Math.max(0, totalCommission), 
      pendingCommission: Math.max(0, pendingCommission),
      referralStatus: ref.status || 'unknown',
      // Individual order commission details
      orderCommission: ref.commission_amount || 0,
      orderCommissionStatus: ref.status || 'unknown'
    };
  };

  const getOrderDisplayId = (order) => {
    if (!order || !order.id) return 'Unknown';
    const idStr = order.id.toString();
    return `#${idStr.slice(-6).padStart(6, '0')}`;
  };

  const getCommissionDisplayInfo = (referrals, orderStatus) => {
    if (!referrals || referrals.length === 0) {
      return { display: null, amount: 0, status: 'none' };
    }
    
    const ref = referrals[0];
    
    // Don't show anything for cancelled referrals
    if (ref.status === 'cancelled') {
      return { 
        display: (
          <span className="commission-cancelled">
            <TrendingDown size={10} /> Commission reversed
          </span>
        ), 
        amount: 0, 
        status: 'cancelled' 
      };
    }
    
    // Only show commission amount for non-cancelled referrals
    if (ref.commission_amount && ref.status !== 'cancelled') {
      const commissionAmount = parseFloat(ref.commission_amount);
      return { 
        display: `+GH₵ ${commissionAmount.toFixed(2)} commission`, 
        amount: commissionAmount, 
        status: ref.status 
      };
    }
    
    return { display: null, amount: 0, status: ref.status || 'unknown' };
  };

  const getOrderCommissionStatus = (referrals) => {
    if (!referrals || referrals.length === 0) {
      return { status: 'none', amount: 0, displayText: 'No commission' };
    }
    
    const ref = referrals[0];
    const commissionAmount = parseFloat(ref.commission_amount || 0);
    
    switch (ref.status) {
      case 'pending':
        return {
          status: 'pending',
          amount: commissionAmount,
          displayText: `Pending: GH₵ ${commissionAmount.toFixed(2)}`
        };
      case 'paid':
        return {
          status: 'paid',
          amount: commissionAmount,
          displayText: `Paid: GH₵ ${commissionAmount.toFixed(2)}`
        };
      case 'cancelled':
        return {
          status: 'cancelled',
          amount: 0,
          displayText: 'Commission reversed'
        };
      default:
        return {
          status: 'unknown',
          amount: 0,
          displayText: 'No commission'
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerInfo = getCustomerInfo(order);
    const nameMatch = customerInfo.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = customerInfo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = order.id && order.id.toString().includes(searchTerm);

    const matchesSearch = nameMatch || emailMatch || idMatch;

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (orderToCancel) {
      await updateOrderStatus(orderToCancel.id, 'cancelled');
    }
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const cancelCancelOrder = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const canCancelOrder = (order) => {
    return !['cancelled', 'completed', 'delivered'].includes(order.status);
  };

  const canCompleteOrder = (order) => {
    return !['cancelled', 'completed'].includes(order.status);
  };

  const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => {
    const [localValue, setLocalValue] = useState(value);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        onChange(localValue);
      }, 300);
      
      return () => clearTimeout(timer);
    }, [localValue, onChange]);
    
    return (
      <div className="search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="search-input"
        />
      </div>
    );
  };

  const RealtimeStatusIndicator = () => (
    <div className="realtime-status">
      <div className={`status-indicator ${realtimeStatus.connected ? 'connected' : 'disconnected'}`}>
        {realtimeStatus.connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      </div>
      <span className="status-text">
        {realtimeStatus.connected ? 'Live' : realtimeStatus.error || 'Offline'}
      </span>
    </div>
  );

  const forceRefreshWithDebug = async () => {
    console.log('🔧 Force refreshing with debug...');
    showNotification('Force refreshing with debug...', 'info', 2000);
    setDebugMode(true);
    await loadOrders();
    setDebugMode(false);
  };

  const calculateCommissionStats = () => {
    let totalEarned = 0;
    let totalPending = 0;
    let totalCancelled = 0;
    
    orders.forEach(order => {
      if (order.referrals && order.referrals.length > 0) {
        const ref = order.referrals[0];
        if (ref.status === 'paid') {
          totalEarned += parseFloat(ref.commission_amount || 0);
        } else if (ref.status === 'pending') {
          totalPending += parseFloat(ref.commission_amount || 0);
        } else if (ref.status === 'cancelled') {
          totalCancelled += parseFloat(ref.commission_amount || 0);
        }
      }
    });
    
    return { totalEarned, totalPending, totalCancelled };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  const commissionStats = calculateCommissionStats();

  return (
    <div className="admin-orders">
      {/* Notification System */}
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
          <div className="header-title-row">
            <h1>Order Management</h1>
            <RealtimeStatusIndicator />
          </div>
          <div className="order-stats">
            <span>Total: {orders.length}</span>
            <span>Pending: {orders.filter(o => o.status === 'pending').length}</span>
            <span>Processing: {orders.filter(o => o.status === 'processing').length}</span>
            <span>Completed: {orders.filter(o => o.status === 'completed').length}</span>
            <span>Cancelled: {orders.filter(o => o.status === 'cancelled').length}</span>
          </div>
          <div className="commission-stats">
            <span><TrendingUp size={12} /> Earned: GH₵ {commissionStats.totalEarned.toFixed(2)}</span>
            <span><Clock size={12} /> Pending: GH₵ {commissionStats.totalPending.toFixed(2)}</span>
            <span><TrendingDown size={12} /> Reversed: GH₵ {commissionStats.totalCancelled.toFixed(2)}</span>
          </div>
          <div className="commission-info">
            <AlertCircle size={14} />
            <small>
              <strong>Commission System:</strong> Orders marked as "completed" automatically pay commissions. 
              Orders marked as "cancelled" automatically reverse commissions.
            </small>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={debugCommissionState}
            className="btn btn-warning btn-small"
            title="Debug commission state"
          >
            <Database size={14} />
            Debug
          </button>
        </div>
      </div>

      <div className="admin-controls">
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by customer name, email, or order ID..."
        />
        
        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            {orderStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          
          <button 
            onClick={loadOrders}
            className="btn btn-secondary"
            title="Refresh orders"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            onClick={forceRefreshWithDebug}
            className="btn btn-warning"
            title="Force refresh with debug"
            disabled={loading}
          >
            <Database size={16} />
            Debug Refresh
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        {/* Mobile Cards View - Added this section */}
        <div className="mobile-orders-list">
          {filteredOrders.map(order => {
            const customerInfo = getCustomerInfo(order);
            const affiliateInfo = getAffiliateInfo(order.referrals);
            const isUpdating = updatingOrders[order.id];
            const hasReferrals = order.referrals && order.referrals.length > 0;
            const referral = hasReferrals ? order.referrals[0] : null;
            const commissionInfo = getCommissionDisplayInfo(order.referrals, order.status);
            const orderCommission = getOrderCommissionStatus(order.referrals);
            const canManuallyPay = hasReferrals && 
              order.status === 'completed' && 
              referral?.status === 'pending';
            const isExpanded = expandedOrderId === order.id;
            
            return (
              <div key={`mobile-${order.id}`} className={`order-card ${isUpdating ? 'updating' : ''}`}>
                {/* Card Header */}
                <div className="card-header" onClick={() => toggleCardExpansion(order.id)}>
                  <div className="order-id-section">
                    <div className="order-id-display">
                      {getOrderDisplayId(order)}
                      {hasReferrals && referral?.status !== 'cancelled' && (
                        <span className="referral-indicator" title="Has affiliate referral">
                          <TrendingUp size={12} />
                        </span>
                      )}
                      {hasReferrals && referral?.status === 'cancelled' && (
                        <span className="referral-cancelled-indicator" title="Commission reversed">
                          <TrendingDown size={12} />
                        </span>
                      )}
                    </div>
                    <span className={`order-status-mobile status-badge ${statusColors[order.status] || 'gray'}`}>
                      {getStatusBadge(order.status)}
                    </span>
                  </div>
                  <div className="order-date">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div className="order-toggle">
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>
                
                {/* Card Body - Always visible */}
                <div className="card-body">
                  <div className="info-group customer-info-mobile">
                    <div className="info-label">Customer</div>
                    <div>
                      <div className="customer-name">
                        {customerInfo.name}
                        {customerInfo.isGuest && <span className="status-badge gray">Guest</span>}
                      </div>
                      <div className="customer-email">{customerInfo.email || 'No email'}</div>
                    </div>
                  </div>
                  
                  <div className="info-group">
                    <div className="info-label">Amount</div>
                    <div className="amount-display">
                      GH₵ {parseFloat(order.total_amount || 0).toFixed(2)}
                      {commissionInfo.display && (
                        <div className={`commission-info-mobile ${commissionInfo.status === 'cancelled' ? 'cancelled' : ''}`}>
                          {commissionInfo.display}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {affiliateInfo.name && (
                    <div className="info-group">
                      <div className="info-label">Affiliate</div>
                      <div className="affiliate-info-mobile">
                        <User size={12} />
                        <span className="affiliate-name">{affiliateInfo.name}</span>
                        <span className="affiliate-code">{affiliateInfo.code}</span>
                      </div>
                    </div>
                  )}
                  
                  {orderCommission.status !== 'none' && (
                    <div className="info-group">
                      <div className="info-label">Commission</div>
                      <div className={`commission-status-mobile commission-${orderCommission.status}`}>
                        {orderCommission.status === 'pending' && <Clock size={10} />}
                        {orderCommission.status === 'paid' && <DollarSign size={10} />}
                        {orderCommission.status === 'cancelled' && <TrendingDown size={10} />}
                        {orderCommission.displayText}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Expandable Details */}
                {isExpanded && (
                  <div className="card-details expanded">
                    <div className="details-grid">
                      <div className="detail-row">
                        <span className="detail-label">Order Date</span>
                        <span className="detail-value">
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Affiliate Status</span>
                        <span className="detail-value">
                          {affiliateInfo.referralStatus || 'No affiliate'}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Commission Amount</span>
                        <span className="detail-value">
                          {referral?.commission_amount ? 
                            `GH₵ ${parseFloat(referral.commission_amount).toFixed(2)}` : 
                            'No commission'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mobile-actions">
                      <div className="action-row">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="btn btn-small"
                          title="View Details"
                          disabled={isUpdating}
                        >
                          <Eye size={16} />
                          Details
                        </button>
                        
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="btn btn-small btn-danger"
                            title="Cancel Order"
                            disabled={isUpdating}
                          >
                            <XCircle size={12} />
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="status-select-mobile"
                        disabled={isUpdating}
                      >
                        {orderStatuses.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      
                      {canManuallyPay && (
                        <button
                          onClick={() => approveAndPayCommission(referral.id, order.id)}
                          className="btn btn-small btn-pay-commission"
                          title="Mark commission as paid"
                          disabled={isUpdating}
                        >
                          <DollarSign size={12} />
                          Pay Commission
                        </button>
                      )}
                      
                      {isUpdating && (
                        <div className="updating-indicator">
                          <RefreshCw size={12} className="spin" />
                          Updating order...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Desktop Table - Keep your existing table exactly as it is */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Affiliate</th>
              <th>Commission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const customerInfo = getCustomerInfo(order);
              const affiliateInfo = getAffiliateInfo(order.referrals);
              const isUpdating = updatingOrders[order.id];
              const hasReferrals = order.referrals && order.referrals.length > 0;
              const referral = hasReferrals ? order.referrals[0] : null;
              const commissionInfo = getCommissionDisplayInfo(order.referrals, order.status);
              const orderCommission = getOrderCommissionStatus(order.referrals);
              const canManuallyPay = hasReferrals && 
                order.status === 'completed' && 
                referral?.status === 'pending';
              
              return (
                <tr key={order.id} className={isUpdating ? 'updating' : ''}>
                  <td>
                    <div className="order-id-cell">
                      {getOrderDisplayId(order)}
                      {hasReferrals && referral?.status !== 'cancelled' && (
                        <span className="referral-indicator" title="Has affiliate referral">
                          <TrendingUp size={12} />
                        </span>
                      )}
                      {hasReferrals && referral?.status === 'cancelled' && (
                        <span className="referral-cancelled-indicator" title="Commission reversed">
                          <TrendingDown size={12} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="customer-info">
                      <strong>
                        {customerInfo.name}
                        {customerInfo.isGuest && <span className="status-badge gray">Guest</span>}
                      </strong>
                      <small>{customerInfo.email || 'No email'}</small>
                    </div>
                  </td>
                  <td className="amount-cell">
                    GH₵ {parseFloat(order.total_amount || 0).toFixed(2)}
                    {commissionInfo.display && (
                      <small className={`commission-amount ${commissionInfo.status === 'cancelled' ? 'cancelled' : ''}`}>
                        {commissionInfo.display}
                      </small>
                    )}
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div className="date-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                      <small>{new Date(order.created_at).toLocaleTimeString()}</small>
                    </div>
                  </td>
                  <td>
                    {affiliateInfo.name ? (
                      <div className="affiliate-info">
                        <User size={12} />
                        <span>{affiliateInfo.name}</span>
                        <small>Code: {affiliateInfo.code}</small>
                        <small className={`affiliate-stats ${affiliateInfo.referralStatus === 'cancelled' ? 'cancelled' : ''}`}>
                          <span className="affiliate-stat-item">
                            Status: {affiliateInfo.referralStatus}
                          </span>
                        </small>
                      </div>
                    ) : (
                      <span className="text-muted">No affiliate</span>
                    )}
                  </td>
                  <td>
                    {orderCommission.status !== 'none' && (
                      <div className="order-commission-status">
                        {orderCommission.status === 'pending' && (
                          <span className="commission-pending">
                            <Clock size={10} /> {orderCommission.displayText}
                          </span>
                        )}
                        {orderCommission.status === 'paid' && (
                          <span className="commission-paid">
                            <DollarSign size={10} /> {orderCommission.displayText}
                          </span>
                        )}
                        {orderCommission.status === 'cancelled' && (
                          <span className="commission-cancelled">
                            <TrendingDown size={10} /> {orderCommission.displayText}
                          </span>
                        )}
                        {canManuallyPay && (
                          <button
                            onClick={() => approveAndPayCommission(referral.id, order.id)}
                            className="btn btn-small btn-success btn-pay"
                            title="Mark commission as paid"
                            disabled={isUpdating}
                          >
                            <DollarSign size={12} />
                            Pay Commission
                          </button>
                        )}
                      </div>
                    )}
                    {orderCommission.status === 'none' && (
                      <span className="text-muted">No commission</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="btn btn-small"
                        title="View Details"
                        disabled={isUpdating}
                      >
                        <Eye size={16} />
                        Details
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="status-select"
                        disabled={isUpdating}
                      >
                        {orderStatuses.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      {canCancelOrder(order) && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="btn btn-small btn-danger"
                          title="Cancel Order"
                          disabled={isUpdating}
                        >
                          <XCircle size={12} />
                          Cancel
                        </button>
                      )}
                      {isUpdating && (
                        <span className="updating-indicator">
                          <RefreshCw size={12} className="spin" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <h3>No Orders Found</h3>
            <p>No orders match your search criteria</p>
            <button onClick={loadOrders} className="btn btn-secondary">
              Refresh Orders
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={closeOrderDetails}
          onStatusUpdate={updateOrderStatus}
          onPayCommission={(referralId, orderId) => approveAndPayCommission(referralId, orderId)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={cancelCancelOrder}
          onConfirm={confirmCancelOrder}
          title="Cancel Order"
          message={`Are you sure you want to cancel order ${orderToCancel ? getOrderDisplayId(orderToCancel) : ''}? 
            This action cannot be undone and will reverse any affiliate commissions.`}
          warning="WARNING: This will automatically reverse any commission paid to the affiliate via database trigger."
        />
      )}
    </div>
  );
};

export default AdminOrders;
