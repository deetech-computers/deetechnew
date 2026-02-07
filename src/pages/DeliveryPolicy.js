import React from 'react';
import { Truck, Package, Clock, CheckCircle, X, MapPin, MessageCircle } from 'lucide-react';
import '../styles/deliverypolicy.css';

const DeliveryPolicy = () => {
  return (
    <div className="delivery-container">
      {/* Hero Section */}
      <div className="delivery-hero">
        <div className="delivery-hero-content">
          <Truck size={48} className="delivery-hero-icon" />
          <h1>DEETECH COMPUTERS Delivery Policy</h1>
          <p className="delivery-hero-subtitle">
            Fast, reliable, and transparent delivery services across Ghana. Your convenience is our priority.
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <section className="delivery-overview">
        <div className="delivery-overview-card">
          <MapPin size={32} />
          <h3>Pickup Available</h3>
          <p>Collect directly from our Kumasi location</p>
        </div>
        <div className="delivery-overview-card">
          <Clock size={32} />
          <h3>Fast Delivery</h3>
          <p>4-24 hours for confirmed orders</p>
        </div>
        <div className="delivery-overview-card">
          <Package size={32} />
          <h3>Free Laptop Delivery</h3>
          <p>Nationwide free delivery for laptops</p>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="delivery-details">
        <div className="delivery-section">
          <h2>🚚 Delivery Options</h2>
          
          {/* Pickup Option */}
          <div className="delivery-card delivery-covered">
            <div className="delivery-header">
              <MapPin size={24} className="delivery-icon-covered" />
              <h3>1. Pickup Option</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Collect items directly from our main pickup point in Kumasi</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Notification sent via phone call, SMS, or WhatsApp when ready</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Complete payment and receive items upon arrival</span>
              </div>
            </div>
          </div>

          {/* Payment Before Delivery */}
          <div className="delivery-card delivery-covered">
            <div className="delivery-header">
              <CheckCircle size={24} className="delivery-icon-covered" />
              <h3>2. Payment Before Delivery</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span><strong>Required for all deliveries outside Kumasi</strong></span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Customer details collected after payment confirmation</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Payment confirmation sent via SMS or WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          <div className="delivery-card delivery-covered">
            <div className="delivery-header">
              <Clock size={24} className="delivery-icon-covered" />
              <h3>3. Delivery Timeline</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span><strong>Fast and reliable delivery service</strong></span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>All confirmed orders delivered within <strong>4 to 24 hours</strong></span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Timeline depends on location and product availability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Delivery & Fees */}
      <section className="delivery-details">
        <div className="delivery-section">
          <h2>💰 Delivery Charges</h2>

          {/* Free Laptop Delivery */}
          <div className="delivery-card delivery-covered">
            <div className="delivery-header">
              <Package size={24} className="delivery-icon-covered" />
              <h3>4. Free Nationwide Laptop Delivery</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span><strong>Free delivery across Ghana</strong> on all laptop purchases</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Valid only after full payment has been received</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Applies exclusively to laptops (not accessories or other items)</span>
              </div>
            </div>
          </div>

          {/* Delivery Fee Communication */}
          <div className="delivery-card">
            <div className="delivery-header">
              <MessageCircle size={24} />
              <h3>5. Delivery Fee Communication</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>For non-laptop items, delivery personnel will contact you upon arrival</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Delivery fee confirmed before handing over the parcel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment on Delivery */}
      <section className="delivery-details">
        <div className="delivery-section">
          <h2>💳 Payment on Delivery</h2>

          {/* Kumasi Payment on Delivery */}
          <div className="delivery-card delivery-covered">
            <div className="delivery-header">
              <MapPin size={24} className="delivery-icon-covered" />
              <h3>I. Same Location – Kumasi</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Customers in Kumasi can opt for payment on delivery</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Delivery fee must be paid to the rider before dispatch</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Specify product details for confirmation before delivery</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Notification sent when delivery process starts</span>
              </div>
              <div className="delivery-note">
                <strong>Note:</strong> Delivery is not free for laptops when payment is made upon delivery.
              </div>
            </div>
          </div>

          {/* Outside Kumasi Payment on Delivery */}
          <div className="delivery-card">
            <div className="delivery-header">
              <MapPin size={24} />
              <h3>II. Payment on Delivery – Outside Kumasi</h3>
            </div>
            <div className="delivery-content">
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Available for selected products only</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span><strong>50% commitment fee</strong> required before dispatch</span>
              </div>
              <div className="delivery-covered-item">
                <CheckCircle size={20} className="delivery-icon-covered" />
                <span>Delivery fee communicated upon rider's arrival</span>
              </div>
              
              <div className="delivery-card delivery-covered" style={{marginTop: '1rem'}}>
                <div className="delivery-header">
                  <CheckCircle size={20} className="delivery-icon-covered" />
                  <h4>Eligible Items for Payment on Delivery (Outside Kumasi)</h4>
                </div>
                <div className="delivery-content">
                  <div className="delivery-covered-item">
                    <CheckCircle size={16} className="delivery-icon-covered" />
                    <span>Phone Accessories</span>
                  </div>
                  <div className="delivery-covered-item">
                    <CheckCircle size={16} className="delivery-icon-covered" />
                    <span>Computer Accessories</span>
                  </div>
                  <div className="delivery-covered-item">
                    <CheckCircle size={16} className="delivery-icon-covered" />
                    <span>Tablets</span>
                  </div>
                </div>
              </div>

              <div className="delivery-card delivery-not-covered" style={{marginTop: '1rem'}}>
                <div className="delivery-header">
                  <X size={20} className="delivery-icon-not-covered" />
                  <h4>Important Notice</h4>
                </div>
                <div className="delivery-content">
                  <div className="delivery-not-covered-item">
                    <X size={16} className="delivery-icon-not-covered" />
                    <span><strong>All laptop orders require full payment before delivery — no exceptions</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="delivery-important-notes">
        <div className="delivery-notes-card">
          <Truck size={32} className="delivery-warning-icon" />
          <h3>Important Information</h3>
          <div className="delivery-notes-list">
            <div className="delivery-note-item">
              <strong>📍 Kumasi Pickup Available</strong>
              <p>Collect your orders directly from our main location in Kumasi after notification</p>
            </div>
            <div className="delivery-note-item">
              <strong>⏱️ Fast Processing</strong>
              <p>Most orders are processed and delivered within 4-24 hours after confirmation</p>
            </div>
            <div className="delivery-note-item">
              <strong>💻 Free Laptop Delivery</strong>
              <p>Enjoy complimentary nationwide delivery on all laptop purchases after full payment</p>
            </div>
            <div className="delivery-note-item">
              <strong>📞 Clear Communication</strong>
              <p>We maintain transparent communication about delivery fees and timelines</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="delivery-about-cta">
        <div className="delivery-cta-content">
          <h2>Need Delivery or Order tracking Assistance?</h2>
          <p>Our team is here to assist you with any delivery inquiries or order tracking.</p>
          <div className="delivery-cta-actions">
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="delivery-btn delivery-btn-secondary"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeliveryPolicy;