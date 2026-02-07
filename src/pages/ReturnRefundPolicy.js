import React from 'react';
import { RefreshCw, Shield, CheckCircle, X, Clock, Package, MessageCircle, Phone } from 'lucide-react';
import '../App.css';
import '../styles/refundpolicy.css';

const ReturnRefundPolicy = () => {
  return (
    <div className="return-container">
      {/* Hero Section */}
      <div className="return-hero">
        <div className="return-hero-content">
          <RefreshCw size={48} className="return-hero-icon" />
          <h1>DEETECH COMPUTERS Return & Refund Policy</h1>
          <p className="return-hero-subtitle">
            Customer satisfaction is our top priority. Clear, hassle-free returns and refunds when you need them.
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <section className="return-overview">
        <div className="return-overview-card">
          <Shield size={32} />
          <h3>Warranty Covered</h3>
          <p>All products include valid warranty protection</p>
        </div>
        <div className="return-overview-card">
          <Clock size={32} />
          <h3>2-5 Day Returns</h3>
          <p>Quick return process for eligible items</p>
        </div>
        <div className="return-overview-card">
          <RefreshCw size={32} />
          <h3>Easy Process</h3>
          <p>Straightforward return and refund steps</p>
        </div>
      </section>

      {/* Warranty Section */}
      <section className="return-details">
        <div className="return-section">
          <h2>🛡️ Warranty on All Items</h2>
          
          <div className="return-card return-covered">
            <div className="return-header">
              <Shield size={24} className="return-icon-covered" />
              <h3>Product Protection</h3>
            </div>
            <div className="return-content">
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span>All products come with valid warranty coverage</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span>Warranty covers manufacturing defects and quality issues</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span>Every product meets our strict quality standards</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span>Contact customer support for warranty claims and assistance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility for Returns */}
      <section className="return-details">
        <div className="return-section">
          <h2>📋 Eligibility for Returns</h2>

          <div className="return-card return-covered">
            <div className="return-header">
              <CheckCircle size={24} className="return-icon-covered" />
              <h3>Valid Return Conditions</h3>
            </div>
            <div className="return-content">
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Delivery Errors:</strong> Wrong product, incomplete order, or damage during delivery</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Timeframe:</strong> Returns must be initiated within 2-5 days of receiving your order</span>
              </div>
              <div className="return-note">
                <strong>Note:</strong> After 2-5 days, returns are only accepted for warranty-related claims.
              </div>
            </div>
          </div>

          {/* Condition of Returned Products */}
          <div className="return-card return-covered">
            <div className="return-header">
              <Package size={24} className="return-icon-covered" />
              <h3>Condition of Returned Products</h3>
            </div>
            <div className="return-content">
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Original Condition:</strong> Item must be in the same state as delivered</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Packaging Intact:</strong> Unopened or with all original packaging, labels, and seals</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Accessories Included:</strong> All manuals, components, and accessories must be returned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Return Process */}
      <section className="return-process">
        <h2>Return Process</h2>
        <div className="return-process-steps">
          <div className="return-process-step">
            <div className="return-step-number">1</div>
            <h3>Contact Support</h3>
            <p>Reach out via WhatsApp or call (0591755964) with order details and issue description</p>
          </div>
          <div className="return-process-step">
            <div className="return-step-number">2</div>
            <h3>Receive Instructions</h3>
            <p>Get clear guidance on return address, packaging, and labeling requirements</p>
          </div>
          <div className="return-process-step">
            <div className="return-step-number">3</div>
            <h3>Return Shipping</h3>
            <p>We cover costs for our errors; customer covers other reasons</p>
          </div>
          <div className="return-process-step">
            <div className="return-step-number">4</div>
            <h3>Inspection & Resolution</h3>
            <p>Item inspection followed by replacement or refund based on your preference</p>
          </div>
        </div>
      </section>

      {/* Return Shipping Details */}
      <section className="return-details">
        <div className="return-section">
          <h2>🚚 Return Shipping</h2>

          <div className="return-card return-covered">
            <div className="return-header">
              <Package size={24} className="return-icon-covered" />
              <h3>Shipping Costs</h3>
            </div>
            <div className="return-content">
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Our Error:</strong> Full return shipping cost covered by DEETECH COMPUTERS</span>
              </div>
              <div className="return-covered-item">
                <CheckCircle size={20} className="return-icon-covered" />
                <span><strong>Customer Reasons:</strong> Shipping costs responsibility of customer (change of mind, incorrect order)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="return-important-notes">
        <div className="return-notes-card">
          <Shield size={32} className="return-warning-icon" />
          <h3>Important Information</h3>
          <div className="return-notes-list">
            <div className="return-note-item">
              <strong>💳 Refund Method</strong>
              <p>Refunds are processed using the same payment method used during purchase</p>
            </div>
            <div className="return-note-item">
              <strong>⏰ Processing Time</strong>
              <p>Refunds may take 5–9 business days after product inspection and approval</p>
            </div>
            <div className="return-note-item">
              <strong>🚫 Non-Eligible Items</strong>
              <p>Items showing physical damage, tampering, or misuse are not eligible for return</p>
            </div>
            <div className="return-note-item">
              <strong>🔍 Inspection Required</strong>
              <p>All returned items undergo thorough inspection before refund or replacement</p>
            </div>
          </div>
        </div>
      </section>

     {/* Contact CTA */}
      <section className="return-about-cta">
        <div className="return-cta-content">
          <h2>Need Refund or Return Assistance?</h2>
          <p>Our customer support team is ready to assist you with returns, refunds, or any questions.</p>
          <div className="return-cta-actions">
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="return-btn return-btn-secondary"
            >
             Start Return Process
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReturnRefundPolicy;