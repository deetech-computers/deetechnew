import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/account.css';
import { User, Package, Settings, Save, TrendingUp, Heart, Shield, RefreshCw, X, ShoppingBag, CreditCard, Truck, CheckCircle, Download } from 'lucide-react';
import AffiliateDashboard from './AffiliateDashboard';
import Wishlist from './Wishlist';

// ========================================
// TOAST NOTIFICATION COMPONENT
// ========================================
const ToastNotification = ({ message, type = 'success', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'info': return 'i';
      case 'warning': return '⚠';
      default: return '✓';
    }
  };

  return (
    <div className={`account-toast-notification account-toast-${type} ${isExiting ? 'account-toast-exiting' : ''}`}>
      <div className="account-toast-content">
        <div className="account-toast-icon">
          {getToastIcon()}
        </div>
        <span className="account-toast-message">{message}</span>
        <button onClick={handleClose} className="account-toast-close" aria-label="Close notification">
          ×
        </button>
      </div>
      <div className="account-toast-progress"></div>
    </div>
  );
};

// Constants
const TABS = {
  PROFILE: 'profile',
  ORDERS: 'orders',
  WISHLIST: 'wishlist',
  AFFILIATE: 'affiliate'
};

const VALID_TABS = Object.values(TABS);

const ORDER_STATUS_MAP = {
  'pending': { step: 1, label: 'Order Placed' },
  'processing': { step: 2, label: 'Processing' },
  'shipped': { step: 3, label: 'Shipped' },
  'delivered': { step: 4, label: 'Delivered' },
  'completed': { step: 4, label: 'Completed' }
};

const Account = () => {
  const { user, isAdmin: authIsAdmin, authInitialized } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    region: '',
    city: ''
  });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [userRole, setUserRole] = useState('user');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Order modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [latestOrderData, setLatestOrderData] = useState(null);
  
  // Loading state tracking
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    userDataLoaded: false,
    ordersLoaded: false,
    affiliateLoaded: false
  });
  
  // Refs
  const dataCache = useRef({
    orders: null,
    userData: null,
    lastFetched: null,
    affiliateStatus: null
  });
  
  const abortControllers = useRef({
    userData: null,
    orders: null,
    affiliate: null,
    orderDetails: null
  });
  
  const previousUserData = useRef(null);
  const hasUserChanged = useRef(false);
  const loadingStartedRef = useRef(false);
  const debounceTimeoutRef = useRef(null);
  const persistProfileCache = useCallback((profile) => {
    try {
      localStorage.setItem('deetech-profile', JSON.stringify({
        ...profile,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Profile cache write failed:', error);
    }
  }, []);

  // Toast functions
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4300);
  }, []);

  // Handle URL parameter for tabs
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authInitialized && !user) {
      navigate('/login');
    }
  }, [authInitialized, user, navigate]);

  // ========================================
  // FIX 1: Updated Main Data Loading Effect
  // ========================================
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (loadingStartedRef.current) return;
      loadingStartedRef.current = true;
      
      // Wait for auth to be initialized
      if (!authInitialized) {
        loadingStartedRef.current = false;
        return;
      }

      // If no user, stop loading
      if (!user) {
        if (isMounted) {
          setLoading(false);
          setLoadingState(prev => ({ ...prev, isLoading: false }));
        }
        loadingStartedRef.current = false;
        return;
      }

      // Use debounce to prevent rapid reloads
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(async () => {
        // Only load data if user changed or cache is stale
        const cacheValid = dataCache.current.lastFetched && 
          (Date.now() - new Date(dataCache.current.lastFetched).getTime() < 60000); // 60 second cache (increased)
        
        const shouldLoadData = !cacheValid || hasUserChanged.current;
        
        if (shouldLoadData) {
          console.log('🚀 Loading account data...');
          setLoading(true);
          setLoadingState({
            isLoading: true,
            userDataLoaded: false,
            ordersLoaded: false,
            affiliateLoaded: false
          });

          try {
            // Load SEQUENTIALLY with delays to prevent rate limiting
            await loadUserData();
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
            
            await loadOrders();
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
            
            await loadAffiliateStatus();
            
            // Update cache
            dataCache.current.lastFetched = new Date().toISOString();
            hasUserChanged.current = false;
            
          } catch (error) {
            console.error('Error loading account data:', error);
            if (isMounted && error.name !== 'AbortError') {
              showToast('Failed to load account data. Please try refreshing the page.', 'error');
            }
          } finally {
            if (isMounted) {
              setLoading(false);
              setLoadingState(prev => ({ ...prev, isLoading: false }));
            }
            loadingStartedRef.current = false;
          }
        } else {
          console.log('📦 Using cached data');
          // Restore from cache
          if (dataCache.current.userData) {
            setUserData(dataCache.current.userData);
          }
          if (dataCache.current.orders) {
            setOrders(dataCache.current.orders);
          }
          if (dataCache.current.affiliateStatus !== null) {
            setIsAffiliate(dataCache.current.affiliateStatus);
          }
          
          if (isMounted) {
            setLoading(false);
            setLoadingState(prev => ({ 
              ...prev, 
              isLoading: false,
              userDataLoaded: true,
              ordersLoaded: true,
              affiliateLoaded: true
            }));
          }
          loadingStartedRef.current = false;
        }
      }, 500); // 500ms debounce delay
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
      loadingStartedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      Object.values(abortControllers.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, [authInitialized, user?.id]); // Only depend on user.id, not the entire user object

  // Load user data
  const loadUserData = async () => {
    if (!user?.id) return;
    
    abortControllers.current.userData = new AbortController();
    
    try {
      console.log('🔍 Loading user data...');
      
      const { data: dbUserData, error } = await supabase
        .from('users')
        .select('first_name, last_name, phone, address, region, city, role')
        .eq('id', user.id)
        .maybeSingle();

      if (abortControllers.current.userData?.signal.aborted) return;

      if (dbUserData) {
        const newUserData = {
          firstName: dbUserData.first_name || '',
          lastName: dbUserData.last_name || '',
          phone: dbUserData.phone || '',
          address: dbUserData.address || '',
          region: dbUserData.region || '',
          city: dbUserData.city || ''
        };
        setUserData(newUserData);
        setUserRole(dbUserData.role || 'user');
        dataCache.current.userData = newUserData;
        persistProfileCache(newUserData);
      } else {
        const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || '';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || '';
        
        const newUserData = {
          firstName,
          lastName,
          phone: user.user_metadata?.phone || '',
          address: user.user_metadata?.address || '',
          region: user.user_metadata?.region || '',
          city: user.user_metadata?.city || ''
        };
        setUserData(newUserData);
        dataCache.current.userData = newUserData;
        persistProfileCache(newUserData);
        
        createUserInDatabase().catch(err => 
          console.log('Background user creation failed:', err)
        );
      }
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Error loading user data:', error);
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error in loadUserData:', error);
      }
    } finally {
      setLoadingState(prev => ({ ...prev, userDataLoaded: true }));
    }
  };

  // Create user in database
  const createUserInDatabase = async () => {
    if (!user) return;
    
    try {
      const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || '';
      const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || '';
      
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          phone: user.user_metadata?.phone || '',
          address: user.user_metadata?.address || '',
          region: user.user_metadata?.region || '',
          city: user.user_metadata?.city || '',
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      console.log('✅ User created in database');
      
    } catch (error) {
      console.error('Error creating user in database:', error);
    }
  };

  // Load orders
  const loadOrders = async () => {
    if (!user) return;
    
    abortControllers.current.orders = new AbortController();
    
    try {
      console.log('📦 Loading orders...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (abortControllers.current.orders?.signal.aborted) return;

      if (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
        dataCache.current.orders = [];
      } else {
        console.log(`✅ Loaded ${data?.length || 0} orders`);
        setOrders(data || []);
        dataCache.current.orders = data || [];
        
        if (showOrderDetails && selectedOrder) {
          const updatedOrder = data?.find(order => order.id === selectedOrder.id);
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
            setLatestOrderData(updatedOrder);
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading orders:', error);
        setOrders([]);
      }
    } finally {
      setLoadingState(prev => ({ ...prev, ordersLoaded: true }));
    }
  };

  // Load order details
  const loadOrderDetails = async (orderId) => {
    if (!user || !orderId) return;
    
    abortControllers.current.orderDetails = new AbortController();
    setOrderDetailsLoading(true);
    
    try {
      console.log('🔍 Loading order details for:', orderId);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (abortControllers.current.orderDetails?.signal.aborted) return;

      if (error) {
        console.error('Error loading order details:', error);
      } else if (data) {
        setSelectedOrder(data);
        setLatestOrderData(data);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading order details:', error);
      }
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  // Load affiliate status
  const loadAffiliateStatus = async () => {
    if (!user) return;
    
    abortControllers.current.affiliate = new AbortController();
    
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (abortControllers.current.affiliate?.signal.aborted) return;

      if (error) {
        console.error('Error checking affiliate status:', error);
        setIsAffiliate(false);
        dataCache.current.affiliateStatus = false;
      } else {
        const isAffiliateActive = !!(data && data.is_active === true);
        setIsAffiliate(isAffiliateActive);
        dataCache.current.affiliateStatus = isAffiliateActive;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error checking affiliate status:', error);
        setIsAffiliate(false);
      }
    } finally {
      setLoadingState(prev => ({ ...prev, affiliateLoaded: true }));
    }
  };

  // ========================================
  // FIX 2: Updated Real-time Order Updates
  // ========================================
  useEffect(() => {
    if (!user?.id) return;
    
    let subscription;
    let isSubscribed = true;
    let updateTimeout;
    
    const setupRealtimeUpdates = async () => {
      try {
        subscription = supabase
          .channel(`orders-${user.id}`, {
            config: {
              broadcast: { self: false }, // Don't receive own events
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${user.id}`
            },
            async (payload) => {
              if (!isSubscribed) return;
              
              console.log('📦 Order update:', payload.eventType);
              
              // Debounce updates - only refresh after 500ms of no changes
              if (updateTimeout) clearTimeout(updateTimeout);
              
              updateTimeout = setTimeout(async () => {
                if (isSubscribed) {
                  await loadOrders();
                  
                  if (showOrderDetails && selectedOrder && payload.new?.id === selectedOrder.id) {
                    await loadOrderDetails(selectedOrder.id);
                  }
                }
              }, 500);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime connected');
            }
          });
      } catch (error) {
        console.error('❌ Realtime error:', error);
      }
    };
    
    setupRealtimeUpdates();
    
    return () => {
      isSubscribed = false;
      if (updateTimeout) clearTimeout(updateTimeout);
      if (subscription) {
        console.log('🔌 Disconnecting realtime');
        supabase.removeChannel(subscription);
      }
    };
  }, [user?.id]); // ONLY user.id - don't include showOrderDetails or selectedOrder!

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!userData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!userData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (userData.phone && userData.phone.trim()) {
      const cleanedPhone = userData.phone.replace(/\D/g, '');
      if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
        newErrors.phone = 'Please enter a valid phone number (8-15 digits)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    console.log('🔄 Save profile initiated');
    
    if (saving || !user) {
      console.log('❌ Already saving or no user');
      return;
    }

    try {
      await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        showToast('Session expired. Please sign in again to update your profile.', 'warning');
        return;
      }
      console.log('🔐 Session user:', {
        id: data.session.user?.id,
        email: data.session.user?.email
      });
      console.log('🧾 Target profile id:', user.id);
    } catch (sessionError) {
      console.warn('Session check failed:', sessionError);
      showToast('Unable to verify session. Please sign in again.', 'warning');
      return;
    }
    
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const inputElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (inputElement) inputElement.focus();
      }
      showToast('Please fix the errors before saving.', 'error');
      return;
    }
    
    console.log('✅ Form validation passed');
    previousUserData.current = { ...userData };
    setSaving(true);
    
    try {
      // Clear cache to force refresh after save
      dataCache.current.lastFetched = null;
      
      // Only update database (skip auth metadata to avoid infinite loop)
      const updateData = {
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        phone: userData.phone?.trim() || null,
        address: userData.address?.trim() || null,
        region: userData.region?.trim() || null,
        city: userData.city?.trim() || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 Updating database only...', updateData);
      
      const { error: dbError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (dbError) {
        console.error('❌ Database update error:', dbError);
        
        // Try upsert as fallback
        console.log('🔄 Trying upsert as fallback...');
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            ...updateData,
            role: userRole,
            is_active: true
          }, { onConflict: 'id' });

        if (upsertError) {
          console.error('❌ Upsert also failed:', upsertError);
          throw upsertError;
        }
      }
      
      console.log('✅ Database updated successfully');
      
      // Update cache with new data
      console.log('🔄 Updating cache...');
      dataCache.current.userData = { ...userData };
      dataCache.current.lastFetched = new Date().toISOString();
      persistProfileCache(userData);
      
      // Mark that user data has changed so next load will refresh
      hasUserChanged.current = true;
      
      // Show success toast
      console.log('🎉 Profile update complete!');
      showToast('Profile updated successfully!', 'success');
      
      // Clear errors
      setErrors({});
      
    } catch (error) {
      console.error('💥 Error updating profile:', error);
      
      if (previousUserData.current) {
        console.log('↩️ Rolling back to previous data');
        setUserData(previousUserData.current);
      }
      
      let errorMessage = 'Failed to update profile';
      if (error.message) {
        if (error.message.includes('RLS') || error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please contact support.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      showToast(errorMessage, 'error');
      
    } finally {
      console.log('🏁 Save process completed');
      setSaving(false);
      previousUserData.current = null;
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async (order) => {
    if (!order) return;
    
    try {
      console.log('📄 Generating invoice for order:', order.id);
      
      const orderIdStr = String(order.id);
      const invoiceNumber = `INV-${orderIdStr.slice(-8)}`;
      
      const invoiceData = {
        invoiceNumber: invoiceNumber,
        orderNumber: orderIdStr,
        orderDate: new Date(order.created_at).toLocaleDateString(),
        customerName: `${userData.firstName} ${userData.lastName}`,
        customerEmail: user.email,
        customerPhone: userData.phone,
        shippingAddress: order.shipping_address || userData.address,
        shippingCity: order.shipping_city || userData.city,
        shippingRegion: order.shipping_region || userData.region,
        items: order.items || [],
        subtotal: order.subtotal || order.total_amount,
        shippingFee: order.shipping_fee || 0,
        tax: order.tax || 0,
        total: order.total_amount,
        status: order.status
      };
      
      const invoiceHTML = generateInvoiceHTML(invoiceData);
      await downloadInvoicePDF(invoiceHTML, invoiceData.invoiceNumber);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast('Failed to generate invoice. Please try again.', 'error');
    }
  };

  // Generate invoice HTML
  const generateInvoiceHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${data.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .invoice-header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info {
            margin-bottom: 30px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .invoice-items {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .invoice-items th, .invoice-items td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .invoice-items th {
            background-color: #f8fafc;
          }
          .totals {
            float: right;
            width: 300px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .total-final {
            font-size: 1.2em;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 100px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>DEETECH COMPUTERS</h1>
          <p>Order Invoice</p>
        </div>
        
        <div class="company-info">
          <p><strong>DEETECH COMPUTERS LTD</strong></p>
          <p>Kumasi & Accra, Ghana</p>
          <p>Email: deetechcomputers01@gmail.com</p>
          <p>Phone: +233 591 755 964</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Bill To:</h3>
            <p><strong>${data.customerName}</strong></p>
            <p>${data.customerEmail}</p>
            <p>${data.customerPhone || 'N/A'}</p>
            <p>${data.shippingAddress}</p>
            <p>${data.shippingCity}, ${data.shippingRegion}</p>
          </div>
          <div>
            <h3>Invoice Details:</h3>
            <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
            <p><strong>Order #:</strong> ${data.orderNumber}</p>
            <p><strong>Order Date:</strong> ${data.orderDate}</p>
            <p><strong>Status:</strong> ${data.status}</p>
          </div>
        </div>
        
        <h3>Order Items</h3>
        <table class="invoice-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.name || 'Product'}</td>
                <td>${item.quantity || 1}</td>
                <td>GH₵ ${parseFloat(item.price || 0).toFixed(2)}</td>
                <td>GH₵ ${parseFloat((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>GH₵ ${parseFloat(data.subtotal).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Shipping:</span>
            <span>GH₵ ${parseFloat(data.shippingFee).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>GH₵ ${parseFloat(data.tax).toFixed(2)}</span>
          </div>
          <div class="total-row total-final">
            <span>Total:</span>
            <span>GH₵ ${parseFloat(data.total).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with DEETECH COMPUTERS!</p>
          <p>For any queries, contact: deetechcomputers01@gmail.com | +233 591 755 964</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Download invoice PDF
  const downloadInvoicePDF = async (html, invoiceNumber) => {
    try {
      if (window.jspdf && typeof window.html2canvas === 'function') {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.left = '-9999px';
        tempElement.innerHTML = html;
        document.body.appendChild(tempElement);
        
        try {
          const canvas = await window.html2canvas(tempElement);
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`invoice-${invoiceNumber}.pdf`);
        } finally {
          document.body.removeChild(tempElement);
        }
        return;
      }
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      
      const newWindow = window.open('', '_blank');
      newWindow.document.write(html);
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
    }
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (name === 'phone' && userData.phone && userData.phone.trim()) {
      const cleanedPhone = userData.phone.replace(/\D/g, '');
      
      if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
        setErrors(prev => ({
          ...prev,
          phone: 'Please enter a valid phone number (8-15 digits)'
        }));
      } else if (errors.phone) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    }
  };

  const formatOrderId = (id) => {
    if (!id) return 'N/A';
    const idStr = String(id);
    if (idStr.includes('-')) {
      return idStr.split('-').pop()?.slice(0, 8) || idStr.slice(-8);
    }
    return idStr.slice(-8);
  };

  const handleViewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setLatestOrderData(order);
    setShowOrderDetails(true);
    await loadOrderDetails(order.id);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
    setLatestOrderData(null);
  };

  const getOrderStatusStep = (status) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    return ORDER_STATUS_MAP[normalizedStatus]?.step || 1;
  };

  const getTimelineSteps = () => {
    const status = latestOrderData?.status?.toLowerCase() || selectedOrder?.status?.toLowerCase() || 'pending';
    const currentStep = getOrderStatusStep(status);
    
    return [
      { 
        step: 1, 
        label: 'Order Placed', 
        icon: <ShoppingBag size={20} />,
        date: latestOrderData?.created_at || selectedOrder?.created_at,
        active: currentStep >= 1 
      },
      { 
        step: 2, 
        label: 'Payment Confirmed', 
        icon: <CreditCard size={20} />,
        active: currentStep >= 2 
      },
      { 
        step: 3, 
        label: 'Shipped', 
        icon: <Truck size={20} />,
        active: currentStep >= 3 
      },
      { 
        step: 4, 
        label: status === 'completed' ? 'Completed' : 'Delivered', 
        icon: <CheckCircle size={20} />,
        active: currentStep >= 4 
      }
    ];
  };

  const displayOrder = latestOrderData || selectedOrder;

  // Show loading while auth initializes
  if (!authInitialized) {
    return (
      <div className="container">
        <div className="account-loading">
          <div className="spinner"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="container">
        <div className="account-loading">
          <div className="spinner"></div>
          <p>Loading your account information...</p>
          {!loadingState.userDataLoaded && <p className="loading-subtext">Loading profile data...</p>}
          {!loadingState.ordersLoaded && <p className="loading-subtext">Loading order history...</p>}
          {!loadingState.affiliateLoaded && <p className="loading-subtext">Checking affiliate status...</p>}
        </div>
      </div>
    );
  }

  // The useEffect will handle redirect, but we still need a fallback
  if (!user) {
    return (
      <div className="container">
        <div className="account-auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to view your account.</p>
          <a href="/login" className="btn">Login</a>
        </div>
      </div>
    );
  }

  const isAdmin = authIsAdmin ? authIsAdmin() : false;

  return (
    <div className="container">
      <div className="account-page">
        <div className="account-header">
          <div className="account-avatar">
            <User size={40} />
          </div>
          <div className="account-info">
            <h1>My Account</h1>
            <p className="account-welcome">
              Welcome back, {userData.firstName || user.email}!
              {userData.lastName && ` ${userData.lastName}`}
            </p>
            <div className="account-badges">
              {isAffiliate && (
                <div className="account-affiliate-badge">
                  <TrendingUp size={16} />
                  Affiliate Member
                </div>
              )}
              {isAdmin && (
                <div className="account-admin-badge">
                  <Shield size={16} />
                  Administrator
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="account-layout">
          <div className="account-sidebar">
            <button 
              className={`account-sidebar-tab ${activeTab === TABS.PROFILE ? 'account-active' : ''}`}
              onClick={() => setActiveTab(TABS.PROFILE)}
              disabled={saving}
            >
              <User size={20} />
              Profile
            </button>
            <button 
              className={`account-sidebar-tab ${activeTab === TABS.ORDERS ? 'account-active' : ''}`}
              onClick={() => setActiveTab(TABS.ORDERS)}
              disabled={saving}
            >
              <Package size={20} />
              My Orders
            </button>
            <button 
              className={`account-sidebar-tab ${activeTab === TABS.WISHLIST ? 'account-active' : ''}`}
              onClick={() => setActiveTab(TABS.WISHLIST)}
              disabled={saving}
            >
              <Heart size={20} />
              My Wishlist
            </button>
            {isAffiliate && (
              <button 
                className={`account-sidebar-tab ${activeTab === TABS.AFFILIATE ? 'account-active' : ''}`}
                onClick={() => setActiveTab(TABS.AFFILIATE)}
                disabled={saving}
              >
                <TrendingUp size={20} />
                Affiliate Dashboard
              </button>
            )}
          </div>

          <div className="account-content">
            {activeTab === TABS.PROFILE && (
              <div className="account-profile-section">
                <div className="section-header">
                  <Settings size={24} />
                  <h2>Personal Information</h2>
                </div>
                
                <form onSubmit={handleSaveProfile} className="account-profile-form" noValidate>
                  <div className="account-form-row">
                    <div className="account-form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={userData.firstName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your first name"
                        required
                        disabled={saving}
                        className={errors.firstName && touched.firstName ? 'account-input-error' : ''}
                      />
                      {errors.firstName && touched.firstName && (
                        <span className="account-error-message">{errors.firstName}</span>
                      )}
                    </div>
                    <div className="account-form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={userData.lastName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your last name"
                        required
                        disabled={saving}
                        className={errors.lastName && touched.lastName ? 'account-input-error' : ''}
                      />
                      {errors.lastName && touched.lastName && (
                        <span className="account-error-message">{errors.lastName}</span>
                      )}
                    </div>
                  </div>

                  <div className="account-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="account-disabled-input"
                    />
                    <small className="help-text">Email cannot be changed</small>
                  </div>

                  <div className="account-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={userData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g., 0241234567"
                      disabled={saving}
                      className={errors.phone && touched.phone ? 'account-input-error' : ''}
                    />
                    {errors.phone && touched.phone && (
                      <span className="account-error-message">{errors.phone}</span>
                    )}
                    <small className="help-text">Optional - Ghana format: 0241234567 or +233241234567</small>
                  </div>

                  <div className="account-form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={userData.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Your delivery address"
                      disabled={saving}
                    />
                  </div>

                  <div className="account-form-row">
                    <div className="account-form-group">
                      <label>Region</label>
                      <input
                        type="text"
                        name="region"
                        value={userData.region}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Your region"
                        disabled={saving}
                      />
                    </div>
                    <div className="account-form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={userData.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Your city"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-large account-save-btn"
                    disabled={saving || (!userData.firstName.trim() || !userData.lastName.trim())}
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={20} className="spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === TABS.ORDERS && (
              <div className="account-orders-section">
                <div className="section-header">
                  <Package size={24} />
                  <h2>Order History</h2>
                </div>
                
                {orders.length === 0 ? (
                  <div className="account-no-orders">
                    <Package size={48} className="no-orders-icon" />
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet.</p>
                    <a href="/products" className="btn btn-primary">
                      Start Shopping
                    </a>
                  </div>
                ) : (
                  <div className="account-orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="account-order-card">
                        <div className="account-order-header">
                          <div>
                            <h3>Order #{formatOrderId(order.id)}</h3>
                            <p className="account-order-date">
                              {new Date(order.created_at).toLocaleDateString('en-GH', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="account-order-status">
                            <span className={`account-status-badge ${order.status?.toLowerCase() || 'processing'}`}>
                              {order.status || 'Processing'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="account-order-details">
                          <p><strong>Total:</strong> GH₵ {parseFloat(order.total_amount || 0).toFixed(2)}</p>
                          <p><strong>Items:</strong> {order.items?.length || 0} items</p>
                        </div>
                        
                        <div className="account-order-actions">
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === TABS.WISHLIST && (
              <div className="account-wishlist-section">
                <Wishlist />
              </div>
            )}

            {activeTab === TABS.AFFILIATE && isAffiliate && (
              <div className="account-affiliate-section">
                <AffiliateDashboard />
              </div>
            )}
          </div>
        </div>
      </div>

      {showOrderDetails && displayOrder && (
        <div className="account-order-modal-overlay">
          <div className="account-order-modal">
            <div className="account-order-modal-header">
              <h3>Order #{formatOrderId(displayOrder.id)} Details</h3>
              <button 
                className="account-order-modal-close"
                onClick={handleCloseOrderDetails}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="account-order-modal-content">
              {orderDetailsLoading ? (
                <div className="account-order-loading">
                  <div className="spinner"></div>
                  <p>Loading order details...</p>
                </div>
              ) : (
                <>
                  <div className="account-order-timeline">
                    {getTimelineSteps().map((step) => (
                      <div 
                        key={step.step} 
                        className={`account-timeline-step ${step.active ? 'account-active' : ''}`}
                      >
                        <div className="account-timeline-icon">
                          {step.icon}
                        </div>
                        <div className="account-timeline-content">
                          <h4>{step.label}</h4>
                          <p>
                            {step.step === 1 && step.date 
                              ? new Date(step.date).toLocaleDateString()
                              : step.step === 4 && displayOrder.status?.toLowerCase() === 'completed'
                                ? 'Order completed'
                                : step.active 
                                  ? 'Completed' 
                                  : 'Pending'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="account-order-items">
                    <h4>Order Items ({displayOrder.items?.length || 0})</h4>
                    <div className="account-order-items-list">
                      {displayOrder.items?.map((item, index) => (
                        <div key={index} className="account-order-item">
                          <div className="account-order-item-image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <div className="account-order-item-placeholder">
                                <Package size={24} />
                              </div>
                            )}
                          </div>
                          <div className="account-order-item-details">
                            <h5>{item.name || 'Product Name'}</h5>
                            <p>Quantity: {item.quantity || 1}</p>
                            <p>Price: GH₵ {parseFloat(item.price || 0).toFixed(2)}</p>
                            <p>Subtotal: GH₵ {parseFloat((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                          </div>
                        </div>
                      )) || (
                        <div className="account-order-item">
                          <div className="account-order-item-placeholder">
                            <Package size={24} />
                          </div>
                          <div className="account-order-item-details">
                            <h5>Order details not available</h5>
                            <p>Please contact support for more information</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="account-order-summary">
                    <h4>Order Summary</h4>
                    <div className="account-order-summary-row">
                      <span>Subtotal</span>
                      <span>GH₵ {parseFloat(displayOrder.subtotal || displayOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="account-order-summary-row">
                      <span>Shipping</span>
                      <span>GH₵ {parseFloat(displayOrder.shipping_fee || 0).toFixed(2)}</span>
                    </div>
                    <div className="account-order-summary-row">
                      <span>Tax</span>
                      <span>GH₵ {parseFloat(displayOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="account-order-summary-row account-order-total">
                      <span>Total</span>
                      <span>GH₵ {parseFloat(displayOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="account-shipping-info">
                    <h4>Shipping Information</h4>
                    <div className="account-shipping-details">
                      <p><strong>Address:</strong> {displayOrder.shipping_address || userData.address || 'Not specified'}</p>
                      <p><strong>City:</strong> {displayOrder.shipping_city || userData.city || 'Not specified'}</p>
                      <p><strong>Region:</strong> {displayOrder.shipping_region || userData.region || 'Not specified'}</p>
                      <p><strong>Phone:</strong> {displayOrder.shipping_phone || userData.phone || 'Not specified'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="account-order-modal-footer">
              <button 
                className="btn btn-outline"
                onClick={handleCloseOrderDetails}
              >
                Close
              </button>
              {(displayOrder.status?.toLowerCase() === 'delivered' || displayOrder.status?.toLowerCase() === 'completed') && (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleDownloadInvoice(displayOrder)}
                >
                  <Download size={16} />
                  Download Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="account-toast-container">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default Account;
