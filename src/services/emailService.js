// services/emailService.js
import emailjs from '@emailjs/browser';

/**
 * EMAIL SERVICE - Handles Order emails and Password Reset emails via EmailJS
 */
class EmailService {
  constructor() {
    // Configuration
    this.config = {
      // Order emails configuration (original)
      PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'CBbrohaBqT3R-haon',
      SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_lixosu5',
      TEMPLATES: {
        CUSTOMER_ORDER: process.env.REACT_APP_EMAILJS_ORDER_TEMPLATE_ID || 'template_uxr4yom',
        ADMIN_ORDER: process.env.REACT_APP_EMAILJS_ADMIN_ORDER_TEMPLATE_ID || 'template_7blr0y9'
      },
      
      // Password reset configuration (new)
      PASSWORD_RESET: {
        PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY_1 || 'UW4qHtQ7nOOHbSmUq',
        SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID_1 || 'service_4zch1g9',
        TEMPLATE_ID: process.env.REACT_APP_EMAILJS_PASSWORD_RESET_TEMPLATE_ID_1 || 'template_z5s437e'
      }
    };

    this.initialized = false;
    this.passwordResetInitialized = false;
    this.adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'deetechcomputers01@gmail.com';
    this.adminName = process.env.REACT_APP_ADMIN_FIRST_NAME || 'Daniel';
  }

  /**
   * INITIALIZATION - Order emails
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      if (typeof window === 'undefined') {
        throw new Error('EmailJS requires browser environment');
      }

      if (!this.config.PUBLIC_KEY) {
        throw new Error('EmailJS public key is not configured');
      }

      emailjs.init(this.config.PUBLIC_KEY);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('EmailJS initialization failed:', error);
      return false;
    }
  }

  /**
   * INITIALIZATION - Password reset emails
   */
  async initializePasswordReset() {
    if (this.passwordResetInitialized) {
      return true;
    }

    try {
      if (typeof window === 'undefined') {
        throw new Error('EmailJS requires browser environment');
      }

      if (!this.config.PASSWORD_RESET.PUBLIC_KEY) {
        throw new Error('Password reset EmailJS public key is not configured');
      }

      // Initialize with password reset public key
      emailjs.init(this.config.PASSWORD_RESET.PUBLIC_KEY);
      this.passwordResetInitialized = true;
      return true;
    } catch (error) {
      console.error('Password reset EmailJS initialization failed:', error);
      return false;
    }
  }

  /**
   * VALIDATION
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmedEmail);
  }

  /**
   * CORE EMAIL SENDING - Order emails
   */
  async sendEmail(serviceId, templateId, templateParams) {
    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error('Email service is not available');
    }

    try {
      const result = await emailjs.send(serviceId, templateId, templateParams);
      
      if (result && result.status === 200) {
        return {
          success: true,
          result,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`Email service returned status: ${result?.status || 'unknown'}`);
      }
    } catch (error) {
      console.error('Email send failed:', error?.message || error?.text || 'Unknown error');
      throw error;
    }
  }

  /**
   * CORE EMAIL SENDING - Password reset emails
   */
  async sendPasswordResetEmail(serviceId, templateId, templateParams) {
    const initialized = await this.initializePasswordReset();
    if (!initialized) {
      throw new Error('Password reset email service is not available');
    }

    try {
      const result = await emailjs.send(serviceId, templateId, templateParams);
      
      if (result && result.status === 200) {
        return {
          success: true,
          result,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`Password reset email service returned status: ${result?.status || 'unknown'}`);
      }
    } catch (error) {
      console.error('Password reset email send failed:', error?.message || error?.text || 'Unknown error');
      throw error;
    }
  }

/**
 * PASSWORD RESET EMAIL
 * Updated to match EmailJS template variables
 */
async sendPasswordReset(toEmail, resetData = {}) {
  if (!this.isValidEmail(toEmail)) {
    throw new Error(`Invalid email address: ${toEmail}`);
  }

  // Template parameters MUST match EmailJS template variables exactly
  const templateParams = {
    to_email: toEmail.trim(),      // This goes to "To Email" field in EmailJS
    to_name: resetData.userName || 'User',
    reset_link: resetData.resetLink || '#',
    user_email: toEmail.trim(),    // This is for display in email body
    expiry_time: resetData.expiryTime || '1 hour',
    company_name: 'DEETECH COMPUTERS',
    support_email: 'deetechcomputers01@gmail.com',
    support_phone: '0591755964',
    current_year: new Date().getFullYear().toString(),
    website_url: window.location.origin || 'https://deetechcomputers.com'
  };

  console.log('📧 Sending password reset email with params:', {
    to_email: templateParams.to_email,
    reset_link: templateParams.reset_link.substring(0, 50) + '...'
  });

  try {
    const result = await this.sendPasswordResetEmail(
      this.config.PASSWORD_RESET.SERVICE_ID,
      this.config.PASSWORD_RESET.TEMPLATE_ID,
      templateParams
    );

    console.log('✅ EmailJS send result:', result);

    return {
      success: true,
      email: toEmail,
      type: 'password_reset',
      timestamp: result.timestamp,
      resetLink: resetData.resetLink
    };
  } catch (error) {
    console.error('❌ Password reset email error:', error);
    return {
      success: false,
      email: toEmail,
      type: 'password_reset',
      error: error.message
    };
  }
}

  /**
   * ORDER CONFIRMATION EMAIL - To Customer
   * KEEPING THIS SECTION THE SAME AS BEFORE
   */
  async sendOrderConfirmation(userEmail, orderData = {}) {
    if (!this.isValidEmail(userEmail)) {
      throw new Error(`Invalid email address: ${userEmail}`);
    }

    const orderTotal = orderData.total || 0;
    
    let orderItems = '';
    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      orderItems = orderData.items.map(item => {
        const unitPrice = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const itemTotal = unitPrice * quantity;
        return `<tr>
          <td width="50%" style="padding:8px 0 8px 5px; font-size:12px;">${item.name || 'Product'}</td>
          <td width="20%" align="center" style="padding:8px 0; font-size:12px;">${quantity}</td>
          <td width="30%" align="right" style="padding:8px 5px 8px 0; font-size:12px;">GH₵ ${itemTotal.toFixed(2)}</td>
        </tr>`;
      }).join('');
    } else {
      orderItems = `<tr><td colspan="3" style="padding:8px 5px; font-size:12px;">No items listed</td></tr>`;
    }

    const templateParams = {
      email: userEmail.trim(),
      to_name: orderData.customerName || 'Valued Customer',
      order_id: String(orderData.orderId || 'N/A'),
      customer_name: orderData.customerName || 'Customer',
      order_subtotal: orderTotal.toFixed(2),
      order_total: orderTotal.toFixed(2),
      currency_symbol: 'GH₵ ',
      order_items: orderItems,
      order_date: orderData.orderDate || new Date().toLocaleDateString('en-GB'),
      payment_method: orderData.paymentMethod || 'Not specified',
      delivery_address: orderData.shippingAddress || 'Address not provided',
      company_name: 'DEETECH COMPUTERS',
      support_email: 'deetechcomputers01@gmail.com',
      support_phone: '0591755964',
      current_year: new Date().getFullYear().toString(),
      website_url: window.location.origin || 'https://deetechcomputers.com',
      order_tracking_url: `${window.location.origin || 'https://deetechcomputers.com'}/orders/${orderData.orderId || ''}`,
      estimated_delivery: orderData.estimatedDelivery || '24 hours Delivery',
      shipping_method: orderData.shippingMethod || 'Standard Shipping',
      subject: `Order Confirmation #${orderData.orderId || ''} - DEETECH COMPUTERS`
    };

    try {
      const result = await this.sendEmail(
        this.config.SERVICE_ID,
        this.config.TEMPLATES.CUSTOMER_ORDER,
        templateParams
      );

      return {
        success: true,
        email: userEmail,
        orderId: orderData.orderId,
        type: 'order_confirmation',
        timestamp: result.timestamp
      };
    } catch (error) {
      return {
        success: false,
        email: userEmail,
        orderId: orderData.orderId,
        type: 'order_confirmation',
        error: error.message
      };
    }
  }

  /**
   * ADMIN ORDER NOTIFICATION
   * KEEPING THIS SECTION THE SAME AS BEFORE
   */
  async notifyAdminNewOrder(orderData = {}) {
    if (!this.isValidEmail(this.adminEmail)) {
      throw new Error(`Invalid admin email address: ${this.adminEmail}`);
    }

    // Format order items for admin email
    let orderItems = '';
    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      orderItems = orderData.items.map(item => {
        const unitPrice = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const itemTotal = unitPrice * quantity;
        const productDetails = item.description || item.category || '';
        const productId = item.id || item.product_id || 'N/A';
        
        return `
          <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff;">
            <strong style="color: #333;">${item.name || 'Product'}</strong>
            <div style="font-size: 13px; color: #666; margin: 4px 0;">
              ID: ${productId} ${productDetails ? `| ${productDetails}` : ''}
            </div>
            <div style="font-size: 13px;">
              <span style="color: #333;">Quantity:</span> ${quantity} × 
              <span style="color: #333;">GH₵ ${unitPrice.toFixed(2)}</span> = 
              <strong style="color: #d9534f;">GH₵ ${itemTotal.toFixed(2)}</strong>
            </div>
          </div>`;
      }).join('');
    } else {
      orderItems = '<div style="padding: 10px; background: #f8f9fa; border-radius: 5px;">No items listed</div>';
    }

    // Calculate totals
    const orderTotal = orderData.total || 0;
    const itemCount = orderData.items?.length || 0;
    const totalQuantity = orderData.items?.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) || 0;

    const templateParams = {
      email: this.adminEmail,
      to_name: this.adminName,
      admin_name: this.adminName,
      order_id: String(orderData.orderId || 'N/A'),
      customer_name: orderData.customerName || 'Customer',
      customer_email: orderData.customerEmail || 'No email provided',
      customer_phone: orderData.customerPhone || 'No phone provided',
      order_total: `GH₵ ${(orderData.total || 0).toFixed(2)}`,
      order_items: orderItems,
      order_date: orderData.orderDate || new Date().toLocaleDateString('en-GB'),
      order_time: new Date().toLocaleTimeString('en-GB'),
      payment_method: orderData.paymentMethod || 'Not specified',
      delivery_address: orderData.shippingAddress || 'Address not provided',
      shipping_method: orderData.shippingMethod || 'Standard Shipping',
      subject: `🚨 NEW ORDER #${orderData.orderId || 'N/A'} - ACTION REQUIRED`,
      customer_notes: orderData.notes || 'No special instructions',
      order_status: 'NEW ORDER',
      view_order_url: `${window.location.origin || 'https://deetechcomputers.com'}/admin/orders/${orderData.orderId || ''}`,
      total_items: itemCount,
      total_quantity: totalQuantity,
      platform: orderData.platform || 'Website',
      ip_address: orderData.ipAddress || 'Not tracked',
      user_agent: orderData.userAgent || 'Unknown browser',
      order_urgency: 'HIGH PRIORITY',
      action_required: 'Process & Confirm',
      estimated_delivery: orderData.estimatedDelivery || 'Within 3-5 days',
      payment_status: orderData.paymentStatus || 'Pending',
      customer_address: orderData.customerAddress || 'Not provided'
    };

    try {
      const result = await this.sendEmail(
        this.config.SERVICE_ID,
        this.config.TEMPLATES.ADMIN_ORDER,
        templateParams
      );

      return {
        success: true,
        email: this.adminEmail,
        orderId: orderData.orderId,
        type: 'admin_notification',
        timestamp: result.timestamp
      };
    } catch (error) {
      return {
        success: false,
        email: this.adminEmail,
        orderId: orderData.orderId,
        type: 'admin_notification',
        error: error.message
      };
    }
  }

  /**
   * COMPLETE ORDER PROCESSING - Sends both customer and admin emails
   * KEEPING THIS SECTION THE SAME AS BEFORE
   */
  async processOrderComplete(orderData = {}) {
    const results = {
      customer: null,
      admin: null,
      allSuccessful: false
    };

    try {
      // Send customer order confirmation
      if (orderData.customerEmail) {
        results.customer = await this.sendOrderConfirmation(
          orderData.customerEmail, 
          orderData
        );
      }

      // Send admin notification
      results.admin = await this.notifyAdminNewOrder(orderData);

      results.allSuccessful = 
        (results.customer?.success !== false) && 
        (results.admin?.success !== false);

      return results;
    } catch (error) {
      return {
        ...results,
        allSuccessful: false,
        error: error.message
      };
    }
  }

  /**
   * GET SERVICE STATUS
   */
  getStatus() {
    return {
      orderEmailInitialized: this.initialized,
      passwordResetInitialized: this.passwordResetInitialized,
      config: {
        serviceId: this.config.SERVICE_ID,
        hasPublicKey: !!this.config.PUBLIC_KEY,
        templates: Object.keys(this.config.TEMPLATES),
        passwordReset: {
          serviceId: this.config.PASSWORD_RESET.SERVICE_ID,
          templateId: this.config.PASSWORD_RESET.TEMPLATE_ID,
          hasPublicKey: !!this.config.PASSWORD_RESET.PUBLIC_KEY
        }
      },
      adminEmail: this.adminEmail
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// ========== EXPORTS ==========
// Export the singleton instance as named export
export { emailService };

// Export individual methods for convenience
export const sendOrderConfirmation = (email, orderData) => emailService.sendOrderConfirmation(email, orderData);
export const notifyAdminNewOrder = (orderData) => emailService.notifyAdminNewOrder(orderData);
export const processOrderComplete = (orderData) => emailService.processOrderComplete(orderData);
export const sendPasswordReset = (email, resetData) => emailService.sendPasswordReset(email, resetData);
export const getEmailServiceStatus = () => emailService.getStatus();

// Default export for backward compatibility
export default emailService;