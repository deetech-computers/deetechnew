import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { 
  sendOrderConfirmation, 
  notifyAdminNewOrder  // Changed from sendAdminOrderNotification
} from '../services/emailService';
import { Shield, Truck, Gift, BarChart3, Calendar, DollarSign, AlertCircle, Package, X } from 'lucide-react';
import CheckoutAffiliateInput from '../components/CheckoutAffiliateInput';
import '../styles/checkout.css';

// Checkout Toast Notification Component
const CheckoutToastNotification = ({ message, type = 'success', onClose }) => {
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
    <div className={`checkout-toast-notification ${type} ${isExiting ? 'checkout-toast-exiting' : ''}`}>
      <div className="checkout-toast-content">
        <div className="checkout-toast-icon">
          {getToastIcon()}
        </div>
        <span className="checkout-toast-message">{message}</span>
        <button onClick={handleClose} className="checkout-toast-close">
          ×
        </button>
      </div>
      <div className="checkout-toast-progress"></div>
    </div>
  );
};



const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    region: '',
    city: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [isAutoApplied, setIsAutoApplied] = useState(false);
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [stockVerification, setStockVerification] = useState({
    verified: false,
    issues: [],
    availableProducts: []
  });
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [toast, setToast] = useState(null);

  const regions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
    'Ahafo', 'Bono East', 'North East', 'Oti', 'Savannah', 'Western North'
  ];

  // Enhanced database error handling
  const handleDatabaseError = (error, operation) => {
    console.error(`Database ${operation} error:`, error);
    
    if (error.code === '23505') {
      throw new Error('This order already exists. Please check your orders.');
    } else if (error.code === '23503') {
      throw new Error('Invalid product or affiliate reference.');
    } else if (error.code === '42501') {
      throw new Error('Database permission error. Please contact support.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(`Database error: ${error.message}`);
    }
  };

  // Retry logic for transient failures
  const retryOperation = async (operation, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        console.warn(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    if (cartData.length === 0) {
      navigate('/cart');
      return;
    }
    setCart(cartData);

    // Pre-fill user info if logged in
    if (user) {
      let cachedProfile = null;
      try {
        cachedProfile = JSON.parse(localStorage.getItem('deetech-profile'));
      } catch (error) {
        cachedProfile = null;
      }

      const profile = cachedProfile || {};
      setUserInfo(prev => ({
        ...prev,
        email: user.email,
        firstName: profile.firstName || user.user_metadata?.firstName || user.user_metadata?.first_name || '',
        lastName: profile.lastName || user.user_metadata?.lastName || user.user_metadata?.last_name || '',
        phone: profile.phone || user.user_metadata?.phone || '',
        address: profile.address || user.user_metadata?.address || '',
        region: profile.region || user.user_metadata?.region || '',
        city: profile.city || user.user_metadata?.city || ''
      }));
    }

    // Check for affiliate code in URL parameters first
    const urlAffiliateCode = searchParams.get('affiliate');
    if (urlAffiliateCode) {
      handleAutoApplyAffiliateCode(urlAffiliateCode);
    } else {
      // Load saved affiliate code from localStorage if no URL parameter
      const savedCode = localStorage.getItem('checkout_affiliate_code');
      if (savedCode) {
        validateAffiliateCode(savedCode);
      }
    }

    // Verify stock availability on component load
    verifyStockAvailability(cartData);
  }, [user, navigate, searchParams]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Stock verification
  const verifyStockAvailability = async (cartItems) => {
    try {
      const productIds = cartItems.map(item => item.id);
      if (productIds.length === 0) return;

      const { data: products, error } = await retryOperation(() =>
        supabase
          .from('products')
          .select('id, stock_quantity, name, is_active, price, min_order_quantity, max_order_quantity')
          .in('id', productIds)
      );

      if (error) {
        handleDatabaseError(error, 'stock verification');
        return;
      }

      const issues = [];
      const availableProducts = [];

      cartItems.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        
        if (!product) {
          issues.push({
            type: 'not_found',
            productId: cartItem.id,
            productName: cartItem.name,
            message: 'Product no longer available'
          });
        } else if (!product.is_active) {
          issues.push({
            type: 'inactive',
            productId: cartItem.id,
            productName: cartItem.name,
            message: 'Product is no longer active'
          });
        } else if (product.stock_quantity < cartItem.quantity) {
          issues.push({
            type: 'insufficient_stock',
            productId: cartItem.id,
            productName: cartItem.name,
            requested: cartItem.quantity,
            available: product.stock_quantity,
            message: `Only ${product.stock_quantity} units available`
          });
        } else if (product.min_order_quantity && cartItem.quantity < product.min_order_quantity) {
          issues.push({
            type: 'min_quantity',
            productId: cartItem.id,
            productName: cartItem.name,
            requested: cartItem.quantity,
            minimum: product.min_order_quantity,
            message: `Minimum order quantity is ${product.min_order_quantity}`
          });
        } else if (product.max_order_quantity && cartItem.quantity > product.max_order_quantity) {
          issues.push({
            type: 'max_quantity',
            productId: cartItem.id,
            productName: cartItem.name,
            requested: cartItem.quantity,
            maximum: product.max_order_quantity,
            message: `Maximum order quantity is ${product.max_order_quantity}`
          });
        } else {
          availableProducts.push({
            ...cartItem,
            current_stock: product.stock_quantity,
            verified_price: product.price
          });
        }
      });

      setStockVerification({
        verified: issues.length === 0,
        issues,
        availableProducts
      });

      // Update cart with verified products only
      if (issues.length > 0) {
        const updatedCart = availableProducts.map(item => ({
          id: item.id,
          name: item.name,
          price: item.verified_price,
          quantity: item.quantity,
          image_url: item.image_url,
          category: item.category,
          slug: item.slug
        }));
        
        setCart(updatedCart);
        localStorage.setItem('deetech-cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }

    } catch (error) {
      console.error('Error verifying stock:', error);
      setStockVerification({
        verified: false,
        issues: [{ type: 'error', message: 'Error verifying stock availability' }],
        availableProducts: []
      });
    }
  };

  // Fetch affiliate info - UPDATED to match your database structure
  const fetchAffiliateInfo = async (code) => {
    if (!code?.trim()) return null;
    
    try {
      const { data, error } = await retryOperation(() =>
        supabase
          .from('affiliates')
          .select('id, full_name, affiliate_code, is_active, total_referrals, total_commission, pending_commission')
          .eq('affiliate_code', code.toUpperCase())
          .eq('is_active', true)
          .maybeSingle()
      );

      if (error) {
        console.error('Error fetching affiliate info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in fetchAffiliateInfo:', error);
      return null;
    }
  };

  // Load affiliate stats - UPDATED to use correct column names
  const loadAffiliateStats = async (affiliateId) => {
    try {
      const { data, error } = await retryOperation(() =>
        supabase
          .from('affiliate_earnings_summary')
          .select('*')
          .eq('affiliate_id', affiliateId)
          .single()
      );

      if (error) {
        console.error('Error loading affiliate stats:', error);
        return;
      }

      if (data) {
        // Map the actual database columns to expected field names
        const mappedStats = {
          // Your database has these columns:
          affiliate_id: data.affiliate_id,
          full_name: data.full_name,
          affiliate_code: data.affiliate_code,
          is_active: data.is_active,
          total_referrals: data.total_referrals,
          
          // Map to expected names in your component
          lifetime_referrals: data.total_referrals || 0, // Use total_referrals for lifetime_referrals
          lifetime_commission: data.lifetime_commission || 0,
          created_at: data.created_at,
          pending_commission: data.pending_commission || 0,
          total_paid_commission: data.total_paid_commission || 0
        };
        
        setAffiliateStats(mappedStats);
      }
    } catch (error) {
      console.error('Error in loadAffiliateStats:', error);
    }
  };

  const handleAutoApplyAffiliateCode = async (code) => {
    if (!code?.trim()) return;

    try {
      const affiliateData = await fetchAffiliateInfo(code);
      
      if (affiliateData) {
        setAffiliateCode(code.toUpperCase());
        setAffiliateInfo(affiliateData);
        setIsAutoApplied(true);
        localStorage.setItem('checkout_affiliate_code', code.toUpperCase());
        
        // Load affiliate stats with correct mapping
        await loadAffiliateStats(affiliateData.id);
        
        console.log(`Auto-applied affiliate code: ${code.toUpperCase()}`);
      } else {
        console.warn(`Invalid affiliate code in URL: ${code}`);
        setAffiliateInfo(null);
        setAffiliateStats(null);
        setIsAutoApplied(false);
        localStorage.removeItem('checkout_affiliate_code');
      }
    } catch (error) {
      console.error('Error validating affiliate code from URL:', error);
      setAffiliateInfo(null);
      setAffiliateStats(null);
      setIsAutoApplied(false);
    }
  };

  const validateAffiliateCode = async (code) => {
    if (!code?.trim()) {
      setAffiliateInfo(null);
      setAffiliateStats(null);
      setIsAutoApplied(false);
      localStorage.removeItem('checkout_affiliate_code');
      return;
    }

    try {
      const affiliateData = await fetchAffiliateInfo(code);
      
      if (affiliateData) {
        setAffiliateInfo(affiliateData);
        setIsAutoApplied(false);
        await loadAffiliateStats(affiliateData.id);
        localStorage.setItem('checkout_affiliate_code', code.toUpperCase());
      } else {
        setAffiliateInfo(null);
        setAffiliateStats(null);
        setIsAutoApplied(false);
        localStorage.removeItem('checkout_affiliate_code');
        showToast('Invalid affiliate code. Please check and try again.', 'error');
      }
    } catch (error) {
      console.error('Error validating affiliate code:', error);
      setAffiliateInfo(null);
      setAffiliateStats(null);
      setIsAutoApplied(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleInputChange = (e) => {
    setUserInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    setPaymentProof(e.target.files[0]);
  };

  const handleAffiliateCodeChange = (code) => {
    setAffiliateCode(code);
    if (code?.trim()) {
      validateAffiliateCode(code);
    } else {
      setAffiliateInfo(null);
      setAffiliateStats(null);
      setIsAutoApplied(false);
      localStorage.removeItem('checkout_affiliate_code');
    }
  };

  const handleRemoveAffiliateCode = () => {
    setAffiliateCode('');
    setAffiliateInfo(null);
    setAffiliateStats(null);
    setIsAutoApplied(false);
    localStorage.removeItem('checkout_affiliate_code');
    showToast('Affiliate code removed', 'info');
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(0[235][0-9]{8}|\+233[235][0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+233') && cleaned.length === 13) {
      return '0' + cleaned.slice(4);
    }
    
    return cleaned;
  };

const sendOrderConfirmationEmail = async (orderId, totalAmount, paymentProofUrl) => {
  try {
    console.log('📧 Sending order confirmation email...');
    
    const customerName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    const shippingAddress = `${userInfo.address || ''}, ${userInfo.city || ''}, ${userInfo.region || ''}`.trim();
    const formattedPhone = formatPhoneNumber(userInfo.phone);
    
    // Validate email
    const customerEmail = userInfo.email?.trim();
    if (!customerEmail) {
      console.warn('⚠️ Customer email is empty, skipping email');
      return;
    }

    // Prepare customer email data
    const customerOrderData = {
      orderId: orderId,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: formattedPhone,
      total: totalAmount,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      orderDate: new Date().toLocaleDateString('en-GB'),
      estimatedDelivery: '3-5 business days',
      shippingMethod: 'Standard Shipping'
    };

    // Send customer email
    console.log('📧 Sending customer email...');
    const customerResult = await sendOrderConfirmation(customerEmail, customerOrderData);
    
    if (customerResult.success) {
      console.log('✅ Customer email sent successfully');
    } else {
      console.warn('⚠️ Customer email failed:', customerResult.error);
    }

    // Prepare admin email data with additional info
    const adminOrderData = {
      orderId: orderId,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: formattedPhone,
      total: totalAmount,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        id: item.id,
        category: item.category
      })),
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      orderDate: new Date().toLocaleDateString('en-GB'),
      orderTime: new Date().toLocaleTimeString('en-GB'),
      estimatedDelivery: '3-5 business days',
      shippingMethod: 'Standard Shipping',
      paymentStatus: 'Pending',
      customerAddress: shippingAddress,
      platform: 'Website',
      customerNotes: 'No special instructions',
      paymentProofUrl: paymentProofUrl || 'Not provided'
    };

    // Send admin email
    console.log('📧 Sending admin email...');
    const adminResult = await notifyAdminNewOrder(adminOrderData);
    
    if (adminResult.success) {
      console.log('✅ Admin email sent successfully');
    } else {
      console.warn('⚠️ Admin email failed:', adminResult.error);
    }
    
  } catch (emailError) {
    console.warn('⚠️ Email sending error, but order was created:', emailError.message);
    // Don't throw - let the order succeed even if email fails
  }
};

  // Validate form before showing checkout modal
  const validateForm = () => {
    // Check required fields
    if (!userInfo.firstName.trim()) {
      showToast('Please enter your first name', 'error');
      document.getElementById('firstName')?.focus();
      return false;
    }

    if (!userInfo.lastName.trim()) {
      showToast('Please enter your last name', 'error');
      document.getElementById('lastName')?.focus();
      return false;
    }

    if (!userInfo.email.trim()) {
      showToast('Please enter your email address', 'error');
      document.getElementById('email')?.focus();
      return false;
    }

    const formattedPhone = formatPhoneNumber(userInfo.phone);
    if (!validatePhoneNumber(formattedPhone)) {
      showToast('Please enter a valid Ghana phone number (e.g., 0241234567 or +233241234567)', 'error');
      document.getElementById('phone')?.focus();
      return false;
    }

    if (!userInfo.address.trim()) {
      showToast('Please enter your delivery address', 'error');
      document.getElementById('address')?.focus();
      return false;
    }

    if (!userInfo.region) {
      showToast('Please select your region', 'error');
      document.getElementById('region')?.focus();
      return false;
    }

    if (!userInfo.city.trim()) {
      showToast('Please enter your city', 'error');
      document.getElementById('city')?.focus();
      return false;
    }

    if (!paymentMethod) {
      showToast('Please select a payment method', 'error');
      return false;
    }

    if (!paymentProof) {
      showToast('Please upload payment proof', 'error');
      document.getElementById('paymentProof')?.focus();
      return false;
    }

    // Final stock verification
    if (!stockVerification.verified) {
      showToast('Some items in your cart have stock issues. Please review your cart.', 'error');
      return false;
    }

    return true;
  };

  // Handle checkout button click
  const handleCheckoutClick = () => {
    if (validateForm()) {
      setShowCheckoutModal(true);
    }
  };

  // Get correct affiliate ID
  const fetchCorrectAffiliateId = async (code) => {
    if (!code) return null;
    
    try {
      console.log('🔄 Fetching affiliate for code:', code);
      
      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select('id, full_name, affiliate_code, is_active')
        .eq('affiliate_code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching affiliate:', error);
        return null;
      }
      
      if (affiliate) {
        console.log('✅ Found affiliate:', {
          id: affiliate.id,
          full_name: affiliate.full_name,
          code: affiliate.affiliate_code
        });
        return affiliate.id;
      }
      
      console.log('⚠️ No affiliate found for code:', code);
      return null;
      
    } catch (error) {
      console.error('Exception in fetchCorrectAffiliateId:', error);
      return null;
    }
  };

 // Main checkout handler
const handleSubmit = async () => {
  setLoading(true);

  try {
    const formattedPhone = formatPhoneNumber(userInfo.phone);

    // Upload payment proof
    let publicUrl = null;
    try {
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `payment-proofs/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await retryOperation(() =>
        supabase.storage
          .from('deetech-files')
          .upload(fileName, paymentProof)
      );

      if (uploadError) {
        throw new Error(`Failed to upload payment proof: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('deetech-files')
        .getPublicUrl(fileName);

      publicUrl = urlData.publicUrl;
      
    } catch (uploadError) {
      console.error('Payment proof upload failed:', uploadError);
      showToast(`Upload failed: ${uploadError.message}. Please try again.`, 'error');
      setLoading(false);
      return;
    }

    // Calculate commission if affiliate code is used
    const totalAmount = getTotalPrice();
    let commissionAmount = 0;
    let commissionPercentage = 5.00;

    let correctAffiliateId = null;
    
    if (affiliateCode) {
      correctAffiliateId = await fetchCorrectAffiliateId(affiliateCode);
      if (correctAffiliateId) {
        commissionAmount = totalAmount * (commissionPercentage / 100);
      }
    }

    // Create properly formatted cart items
    const cleanCartItems = cart.map(item => {
      // Convert product ID to number (bigint)
      let productId = item.id;
      
      if (typeof productId === 'string') {
        const parsed = parseInt(productId, 10);
        productId = isNaN(parsed) ? null : parsed;
      }
      
      return {
        id: productId,
        name: item.name || '',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        image_url: item.image_url || '',
        category: item.category || '',
        slug: item.slug || ''
      };
    });

    console.log('✅ Clean cart items:', cleanCartItems);

    // Create order data
    const orderData = {
      customer_email: userInfo.email || 'not-provided@example.com',
      customer_name: `${userInfo.firstName} ${userInfo.lastName}`.trim() || 'Customer',
      customer_phone: formattedPhone || '0000000000',
      delivery_address: userInfo.address || 'Address not provided',
      region: userInfo.region || 'Not specified',
      city: userInfo.city || 'Not specified',
      total_amount: totalAmount.toString() || '0.00',
      payment_method: paymentMethod || 'not-specified',
      payment_proof_url: publicUrl || '',
      status: 'pending',
      affiliate_code: affiliateCode || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Only add user_id if it exists
    if (user?.id) {
      orderData.user_id = user.id;
    }

    console.log('📝 Calling RPC with:', {
      order_data: orderData,
      cart_items: cleanCartItems,
      affiliate_id: correctAffiliateId,
      commission: parseFloat(commissionAmount.toFixed(2))
    });

    // Call the RPC function
    const { data: orderResult, error: orderError } = await supabase.rpc(
      'process_complete_order',
      {
        p_order_data: orderData,
        p_cart_items: cleanCartItems,
        p_affiliate_id: correctAffiliateId,
        p_commission_amount: parseFloat(commissionAmount.toFixed(2)) || 0
      }
    );

    console.log('🔍 RPC Response:', { orderResult, orderError });

    if (orderError) {
      console.error('❌ RPC error details:', {
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code
      });
      
      // Provide more specific error messages
      if (orderError.code === '23502') {
        throw new Error('Missing required information. Please check all fields are filled.');
      } else if (orderError.code === '23503') {
        throw new Error('Invalid product or affiliate reference.');
      } else if (orderError.code === '23505') {
        throw new Error('Duplicate order detected. Please try again or contact support.');
      } else {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }
    }

    console.log('✅ Order created via RPC:', orderResult);

    if (orderResult && orderResult.success) {
      // Send order confirmation email
      await sendOrderConfirmationEmail(
        orderResult.order_id, 
        totalAmount, 
        publicUrl
      );

      // Success - clear local storage and navigate
      localStorage.removeItem('deetech-cart');
      localStorage.removeItem('checkout_affiliate_code');
      window.dispatchEvent(new Event('storage'));

      // Close modal and show success toast
      setShowCheckoutModal(false);
      showToast('Order placed successfully! Redirecting...', 'success');

      // Navigate to thank you page
      setTimeout(() => {
        navigate('/thank-you', { 
          state: { 
            orderId: orderResult.order_id,
            affiliateCode: affiliateCode,
            commissionAmount: commissionAmount,
            affiliateName: affiliateInfo?.full_name,
            totalAmount: totalAmount
          } 
        });
      }, 2000);
    } else {
      throw new Error(orderResult?.error || 'Order creation failed');
    }

  } catch (error) {
    console.error('Checkout error:', error);
    showToast(`Error placing order: ${error.message}. Please try again.`, 'error');
  } finally {
    setLoading(false);
  }
};



















  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'MTN':
        return {
          number: '0591755964',
          name: 'Daniel Adjei Mensah (DEETECH COMPUTERS)',
          instructions: 'Send exact amount via MTN Mobile Money'
        };
      case 'Telecel':
        return {
          merchantId: '451444',
          name: 'Deetek 360 Enterprise (DEETECH)',
          instructions: 'Use merchant ID for payment'
        };
      case 'Hubtel':
        return {
          code: '*713*5964#',
          name: 'DEETEK 360 Enterprise (DEETECH computers)',
          instructions: 'Dial the code to make payment'
        };
      case 'Bank':
        return {
          bank: 'CALBANK',
          name: 'DEETEK 360 Enterprise (DEETECH computers)',
          accountNumber: '1400009398769',
          instructions: 'Transfer to bank account'
        };
      default:
        return null;
    }
  };

  const paymentInstructions = getPaymentInstructions();
  const commissionAmount = affiliateInfo ? (getTotalPrice() * 0.05) : 0;
  const totalAmount = getTotalPrice();

  return (
    <div className="checkout-container">
      {toast && (
        <CheckoutToastNotification
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
      
      <h1>Checkout</h1>
      
      {/* Stock Verification Status */}
      {!stockVerification.verified && stockVerification.issues.length > 0 && (
        <div className="checkout-stock-verification-warning">
          <AlertCircle size={20} />
          <div>
            <h4>Cart Updated</h4>
            <p>Some items were removed or updated due to stock availability:</p>
            <ul>
              {stockVerification.issues.map((issue, index) => (
                <li key={index}>
                  <strong>{issue.productName}</strong>: {issue.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {stockVerification.verified && (
        <div className="checkout-stock-verification-success">
          <Package size={20} />
          <div>
            <h4>Stock Verified</h4>
            <p>All items in your cart are available and ready for purchase.</p>
          </div>
        </div>
      )}
      
      <div className="checkout-layout">
        <div className="checkout-form-section">
          <form className="checkout-form">
            {/* Customer Information Section */}
            <div className="checkout-form-section">
              <h2>
                <Shield size={20} />
                Customer Information
              </h2>
              
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={userInfo.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="checkout-form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={userInfo.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="checkout-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userInfo.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="checkout-form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., 0241234567 or +233241234567"
                  required
                />
              </div>
            </div>

            {/* Enhanced Affiliate Code Section */}
            <div className="checkout-form-section">
              <h2>
                <Gift size={20} />
                Support a Friend (Optional)
              </h2>
              
              {isAutoApplied ? (
                <div className="checkout-auto-applied-affiliate">
                  <div className="checkout-affiliate-success-message">
                    <Gift size={16} />
                    <span>
                      <strong>{affiliateInfo?.full_name}'s</strong> affiliate code has been automatically applied!
                    </span>
                  </div>
                  <button 
                    type="button"
                    className="checkout-btn checkout-btn-small checkout-btn-secondary"
                    onClick={handleRemoveAffiliateCode}
                  >
                    Remove Code
                  </button>
                </div>
              ) : (
                <CheckoutAffiliateInput 
                  onAffiliateCodeChange={handleAffiliateCodeChange}
                  initialValue={affiliateCode}
                />
              )}
              
              {affiliateInfo && (
                <div className="checkout-affiliate-confirmation">
                  <div className="checkout-affiliate-success-message">
                    <Gift size={16} />
                    <span>
                      Supporting <strong>{affiliateInfo.full_name}</strong> with 
                      <strong> GH₵ {commissionAmount.toFixed(2)}</strong> commission!
                    </span>
                  </div>
                  
                  {affiliateStats && (
                    <div className="checkout-affiliate-stats-preview">
                      <div className="checkout-stats-grid-mini">
                        <div className="checkout-stat-item">
                          <BarChart3 size={14} />
                          <span>Total Referrals: {affiliateStats.lifetime_referrals || 0}</span>
                        </div>
                        <div className="checkout-stat-item">
                          <DollarSign size={14} />
                          <span>Lifetime Earnings: GH₵ {(affiliateStats.lifetime_commission || 0).toFixed(2)}</span>
                        </div>
                        <div className="checkout-stat-item">
                          <Calendar size={14} />
                          <span>Active since: {new Date(affiliateStats.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="checkout-form-section">
              <h2>
                <Truck size={20} />
                Delivery Information
              </h2>
              
              <div className="checkout-form-group">
                <label htmlFor="address">Delivery Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={userInfo.address}
                  onChange={handleInputChange}
                  placeholder="Full delivery address"
                  required
                />
              </div>
              
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label htmlFor="region">Region *</label>
                  <select
                    id="region"
                    name="region"
                    value={userInfo.region}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Region</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div className="checkout-form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={userInfo.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="checkout-free-delivery-banner">
                <Truck size={24} />
                <div>
                  <strong>Free Delivery</strong>
                  <p>Enjoy free delivery on all orders across Ghana</p>
                </div>
              </div>
            </div>

            <div className="checkout-form-section">
              <h2>Choose Payment Method</h2>
              
              <div className="checkout-payment-options">
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="MTN"
                    checked={paymentMethod === 'MTN'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  />
                  <div className="checkout-payment-content">
                    <span className="checkout-payment-name">MTN Mobile Money</span>
                    <span className="checkout-payment-desc">Pay with MTN MoMo</span>
                  </div>
                </label>
                
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="Telecel"
                    checked={paymentMethod === 'Telecel'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="checkout-payment-content">
                    <span className="checkout-payment-name">Telecel Cash</span>
                    <span className="checkout-payment-desc">Pay with Telecel</span>
                  </div>
                </label>
                
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="Hubtel"
                    checked={paymentMethod === 'Hubtel'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="checkout-payment-content">
                    <span className="checkout-payment-name">Hubtel</span>
                    <span className="checkout-payment-desc">Mobile Money & Card</span>
                  </div>
                </label>
                
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="Bank"
                    checked={paymentMethod === 'Bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="checkout-payment-content">
                    <span className="checkout-payment-name">Bank Transfer</span>
                    <span className="checkout-payment-desc">Direct bank transfer</span>
                  </div>
                </label>
              </div>

              {paymentInstructions && (
                <div className="checkout-payment-instructions">
                  <h4>Payment Instructions:</h4>
                  <div className="checkout-instructions-content">
                    <p><strong>{paymentInstructions.instructions}</strong></p>
                    {paymentInstructions.number && (
                      <p>Number: <strong>{paymentInstructions.number}</strong></p>
                    )}
                    {paymentInstructions.merchantId && (
                      <p>Merchant ID: <strong>{paymentInstructions.merchantId}</strong></p>
                    )}
                    {paymentInstructions.code && (
                      <p>Code: <strong>{paymentInstructions.code}</strong></p>
                    )}
                    {paymentInstructions.bank && (
                      <>
                        <p>Bank: <strong>{paymentInstructions.bank}</strong></p>
                        <p>Account: <strong>{paymentInstructions.accountNumber}</strong></p>
                      </>
                    )}
                    <p>Name: <strong>{paymentInstructions.name}</strong></p>
                    <p>Amount: <strong>GH₵ {totalAmount.toFixed(2)}</strong></p>
                  </div>
                </div>
              )}

              <div className="checkout-form-group">
                <label htmlFor="paymentProof">Upload Payment Proof *</label>
                <input
                  type="file"
                  id="paymentProof"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  required
                />
                <small>Upload screenshot of payment confirmation or transaction ID</small>
              </div>
            </div>

            {/* DESKTOP Checkout Button - Hidden on Mobile */}
            <div className="checkout-desktop-checkout-btn-container">
              <button 
                type="button"
                className="checkout-btn checkout-btn-large checkout-checkout-submit-btn"
                disabled={loading || !stockVerification.verified}
                onClick={handleCheckoutClick}
              >
                Review & Place Order - GH₵ {totalAmount.toFixed(2)}
              </button>

              {!stockVerification.verified && (
                <div className="checkout-checkout-disabled-message">
                  <AlertCircle size={16} />
                  Cannot proceed with checkout due to stock issues. Please review your cart.
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="checkout-order-summary">
          <h3>Order Summary</h3>
          
          <div className="checkout-order-items">
            {cart.map(item => (
              <div key={item.id} className="checkout-order-item">
                <img 
                  src={item.image_url || '/api/placeholder/60/60'} 
                  alt={item.name}
                />
                <div className="checkout-item-details">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                </div>
                <div className="checkout-item-total">
                  GH₵ {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="checkout-order-totals">
            <div className="checkout-total-row">
              <span>Subtotal:</span>
              <span>GH₵ {totalAmount.toFixed(2)}</span>
            </div>
            
            {affiliateInfo && (
              <div className="checkout-total-row checkout-affiliate-info">
                <span>Supporting {affiliateInfo.full_name}:</span>
                <span className="checkout-commission-info">GH₵ {commissionAmount.toFixed(2)} commission</span>
              </div>
            )}
            
            <div className="checkout-total-row">
              <span>Delivery:</span>
              <span className="checkout-free">FREE</span>
            </div>
            
            <div className="checkout-total-row checkout-grand-total">
              <span>Total:</span>
              <span>GH₵ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {affiliateInfo && (
            <div className="checkout-affiliate-notice">
              <Gift size={16} />
              <p>
                {isAutoApplied ? (
                  <>
                    Supporting <strong>{affiliateInfo.full_name}</strong> through their referral link!
                    They'll receive <strong>GH₵ {commissionAmount.toFixed(2)}</strong> commission once your order is confirmed.
                  </>
                ) : (
                  <>
                    Thank you for supporting <strong>{affiliateInfo.full_name}</strong>! 
                    They'll receive <strong>GH₵ {commissionAmount.toFixed(2)}</strong> commission once your order is confirmed.
                  </>
                )}
              </p>
              
              {affiliateStats && (
                <div className="checkout-affiliate-performance">
                  <div className="checkout-performance-stats">
                    <span>This will be their {(affiliateStats.lifetime_referrals || 0) + 1} referral</span>
                    <span>Total earned: GH₵ {(parseFloat(affiliateStats.lifetime_commission || 0) + commissionAmount).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="checkout-stock-status-summary">
            <h4>Stock Status</h4>
            {stockVerification.verified ? (
              <div className="checkout-stock-status-verified">
                <Package size={16} />
                <span>All items are available and ready for purchase</span>
              </div>
            ) : (
              <div className="checkout-stock-status-issues">
                <AlertCircle size={16} />
                <span>Some items need attention before checkout</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Pop-out Modal */}
      {showCheckoutModal && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal">
            <div className="checkout-modal-header">
              <h2>Confirm Your Order</h2>
              <button 
                className="checkout-close-modal-btn"
                onClick={() => setShowCheckoutModal(false)}
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="checkout-modal-content">
              <div className="checkout-order-review-section">
                <h3>Order Details</h3>
                <div className="checkout-review-items">
                  {cart.map(item => (
                    <div key={item.id} className="checkout-review-item">
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-quantity">Qty: {item.quantity}</span>
                      <span className="checkout-item-price">GH₵ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="checkout-review-totals">
                  <div className="checkout-total-line">
                    <span>Subtotal:</span>
                    <span>GH₵ {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="checkout-total-line">
                    <span>Delivery:</span>
                    <span className="checkout-free">FREE</span>
                  </div>
                  <div className="checkout-total-line checkout-grand-total">
                    <span>Total:</span>
                    <span>GH₵ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="checkout-customer-review-section">
                <h3>Delivery Information</h3>
                <div className="checkout-review-info">
                  <p><strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}</p>
                  <p><strong>Phone:</strong> {userInfo.phone}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                  <p><strong>Address:</strong> {userInfo.address}, {userInfo.city}, {userInfo.region}</p>
                  <p><strong>Payment Method:</strong> {paymentMethod}</p>
                </div>
              </div>
              
              {affiliateInfo && (
                <div className="checkout-affiliate-review-section">
                  <h3>Affiliate Support</h3>
                  <div className="checkout-affiliate-review">
                    <p>Supporting <strong>{affiliateInfo.full_name}</strong></p>
                    <p>Commission: <strong>GH₵ {commissionAmount.toFixed(2)}</strong></p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="checkout-modal-actions">
              <button 
                className="checkout-btn checkout-btn-secondary"
                onClick={() => setShowCheckoutModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="checkout-btn checkout-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="checkout-loading-spinner-small"></div>
                    Processing Order...
                  </>
                ) : (
                  `Confirm & Pay GH₵ ${totalAmount.toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Checkout Bar - Only shows on mobile */}
      <div className="checkout-sticky-bar">
        <div className="checkout-sticky-summary">
          <div className="checkout-total-amount">
            <span>Total Amount:</span>
            <strong>GH₵ {totalAmount.toFixed(2)}</strong>
          </div>
          <div className="checkout-stock-status">
            {stockVerification.verified ? (
              <div className="checkout-status-verified">
                <Package size={14} />
                <span>Ready to order</span>
              </div>
            ) : (
              <div className="checkout-status-issues">
                <AlertCircle size={14} />
                <span>Stock issues</span>
              </div>
            )}
          </div>
        </div>
        <button 
          type="button"
          className="checkout-sticky-checkout-btn"
          disabled={loading || !stockVerification.verified}
          onClick={handleCheckoutClick}
        >
          {loading ? (
            <>
              <div className="checkout-loading-spinner-small"></div>
              Processing...
            </>
          ) : (
            `Review Order - GH₵ ${totalAmount.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
