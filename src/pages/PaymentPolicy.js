import React from 'react';
import { CreditCard, Smartphone, CheckCircle, Truck, MessageCircle, Shield } from 'lucide-react';

import '../styles/paymentpolicy.css';

const PaymentPolicy = () => {
  return (
    <div className="payment-container">
      {/* Hero Section */}
      <div className="payment-hero">
        <div className="payment-hero-content">
          <CreditCard size={48} className="payment-hero-icon" />
          <h1>DEETECH Computers Payment Policy</h1>
          <p className="payment-hero-subtitle">
            Secure, convenient payment options for your tech purchases. Your security is our priority.
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <section className="payment-overview">
        <div className="payment-overview-card">
          <Shield size={32} />
          <h3>Secure Payments</h3>
          <p>All transactions are protected and verified</p>
        </div>
        <div className="payment-overview-card">
          <Smartphone size={32} />
          <h3>Mobile Money</h3>
          <p>Quick payments via MTN & Telecel</p>
        </div>
        <div className="payment-overview-card">
          <CreditCard size={32} />
          <h3>Bank Transfer</h3>
          <p>Direct bank payments available</p>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="payment-details">
        <div className="payment-section">
          <h2>💳 Payment Methods</h2>
          
          {/* Bank Transfer */}
          <div className="payment-card covered">
            <div className="payment-header">
              <CreditCard size={24} className="payment-icon-covered" />
              <h3>Bank Transfer</h3>
            </div>
            <div className="payment-content">
              <div className="payment-details-list">
                <div className="payment-item">
                  <strong>Bank:</strong>
                  <span>CALBANK</span>
                </div>
                <div className="payment-item">
                  <strong>Account Number:</strong>
                  <span>1400009398769</span>
                </div>
                <div className="payment-item">
                  <strong>Account Name:</strong>
                  <span>DEETEK 360 Enterprise (DEETECH COMPUTERS)</span>
                </div>
              </div>
            </div>
          </div>

          {/* MTN Mobile Money */}
          <div className="payment-card covered">
            <div className="payment-header">
              <Smartphone size={24} className="payment-icon-covered" />
              <h3>MTN Mobile Money</h3>
            </div>
            <div className="payment-content">
              <div className="payment-details-list">
                <div className="payment-item">
                  <strong>MoMo Number:</strong>
                  <span>0591755964</span>
                </div>
                <div className="payment-item">
                  <strong>Account Name:</strong>
                  <span>Daniel Adjei Mensah (DEETECH COMPUTERS)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hubtel */}
          <div className="payment-card covered">
            <div className="payment-header">
              <Smartphone size={24} className="payment-icon-covered" />
              <h3>Hubtel</h3>
            </div>
            <div className="payment-content">
              <div className="payment-details-list">
                <div className="payment-item">
                  <strong>Dial:</strong>
                  <span>*713*5964#</span>
                </div>
                <div className="payment-item">
                  <strong>Account Name:</strong>
                  <span>DEETEK 360 Enterprise (DEETECH COMPUTERS)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Telecel Cash */}
          <div className="payment-card covered">
            <div className="payment-header">
              <Smartphone size={24} className="payment-icon-covered" />
              <h3>Telecel (Vodafone) Cash</h3>
            </div>
            <div className="payment-content">
              <div className="payment-details-list">
                <div className="payment-item">
                  <strong>Merchant ID:</strong>
                  <span>451444</span>
                </div>
                <div className="payment-item">
                  <strong>Account Name:</strong>
                  <span>DEETEK 360 Enterprise (DEETECH COMPUTERS)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* After Payment Process */}
      <section className="payment-process">
        <h2>After Making Payment</h2>
        <div className="payment-process-steps">
          <div className="payment-process-step">
            <div className="payment-step-number">1</div>
            <h3>Make Payment</h3>
            <p>Choose your preferred payment method and complete the transaction</p>
          </div>
          <div className="payment-process-step">
            <div className="payment-step-number">2</div>
            <h3>Take Screenshot</h3>
            <p>Capture the transaction confirmation screen as proof of payment</p>
          </div>
          <div className="payment-process-step">
            <div className="payment-step-number">3</div>
            <h3>Share Details</h3>
            <p>Send screenshot and delivery information via WhatsApp or upload on payment page</p>
          </div>
          <div className="payment-process-step">
            <div className="payment-step-number">4</div>
            <h3>Order Confirmation</h3>
            <p>We'll verify and confirm your order instantly</p>
          </div>
        </div>
      </section>

      {/* Delivery Information */}
      <section className="payment-details">
        <div className="payment-section">
          <h2>🚚 Delivery Information</h2>
          
          <div className="payment-card covered">
            <div className="payment-header">
              <Truck size={24} className="payment-icon-covered" />
              <h3>Delivery Charges</h3>
            </div>
            <div className="payment-content">
              <div className="covered-item">
                <CheckCircle size={20} className="payment-icon-covered" />
                <span><strong>Free Delivery</strong> - Available for laptop purchases anywhere in Ghana</span>
              </div>
              <div className="covered-item">
                <CheckCircle size={20} className="payment-icon-covered" />
                <span><strong>Delivery Charges Apply</strong> - For accessories and other products</span>
              </div>
            </div>
          </div>

          {/* Required Information */}
          <div className="payment-card">
            <div className="payment-header">
              <MessageCircle size={24} />
              <h3>Required Delivery Information</h3>
            </div>
            <div className="payment-content">
              <div className="info-form">
                <div className="info-item">
                  <strong>Full Name:</strong>
                  <span>Your complete name as on ID</span>
                </div>
                <div className="info-item">
                  <strong>Phone Number:</strong>
                  <span>Active contact number</span>
                </div>
                <div className="info-item">
                  <strong>Region:</strong>
                  <span>Your region in Ghana</span>
                </div>
                <div className="info-item">
                  <strong>Town/City:</strong>
                  <span>Your specific town or city</span>
                </div>
                <div className="info-item">
                  <strong>Delivery Address:</strong>
                  <span>Complete address for delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Saving Tip */}
      <section className="payment-important-notes">
        <div className="payment-notes-card">
          <CreditCard size={32} className="payment-warning-icon" />
          <h3>Save on Transaction Charges</h3>
          <div className="payment-notes-list">
            <div className="payment-note-item">
              <strong>💰 Reduce Fees with Cash-Out</strong>
              <p>Authorize a cash-out payment directly to our Certified accounts for faster and cheaper transactions</p>
            </div>
            <div className="payment-note-item">
              <strong>⚡ Instant Confirmation</strong>
              <p>Cash-out payments are processed instantly with lower fees compared to standard transfers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="payment-about-cta">
        <div className="payment-cta-content">
          <h2>Need Payment Assistance?</h2>
          <p>Our team is here to help with any payment questions or confirmation issues.</p>
          <div className="payment-cta-actions">
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="payment-btn payment-btn-secondary"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentPolicy;