import React from 'react';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  MapPin, 
  HelpCircle,
  Truck,
  Shield,
  Users,
  Heart,
  HeadphonesIcon,
  MessageSquare,
  LifeBuoy,
  UserCheck,
} from 'lucide-react';
import '../App.css';
import '../styles/support.css';

const Support = () => {
  return (
    <div className="support-container">
      {/* Hero Section */}
      <div className="support-hero">
        <div className="support-hero-content">
          <div className="support-hero-icon-container">
            <HeadphonesIcon size={64} className="support-hero-icon" />
          </div>
          
          <h1>Customer Support</h1>
          <p className="support-hero-subtitle">
            We're Here to Help You
          </p>
          <p className="support-hero-description">
            At DEETECH COMPUTERS, your satisfaction is our priority. 
            Get in touch with our support team for any questions, technical assistance, 
            or after-sales service.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <section className="support-contact-methods">
        <h2>Get in Touch</h2>
        <div className="support-contact-grid">
          <div className="support-contact-card">
            <Phone size={32} className="support-contact-icon" />
            <h3>Phone Support</h3>
            <p className="support-contact-detail">+233 59 175 5964</p>
            <p className="support-contact-description">
              Call us for immediate assistance with orders, products, or technical support
            </p>
            <a href="tel:+233591755964" className="support-contact-link">
              Call Now
            </a>
          </div>

          <div className="support-contact-card">
            <MessageCircle size={32} className="support-contact-icon" />
            <h3>WhatsApp</h3>
            <p className="support-contact-detail">+233 59 175 5964</p>
            <p className="support-contact-description">
              Chat with us on WhatsApp for quick responses and easy file sharing
            </p>
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="support-contact-link"
            >
              Start Chat
            </a>
          </div>

          <div className="support-contact-card">
            <Mail size={32} className="support-contact-icon" />
            <h3>Email Support</h3>
            <p className="support-contact-detail">deetechcomputers01@gmil.com</p>
            <p className="support-contact-description">
              Send us detailed inquiries and we'll respond within 24 hours
            </p>
            <a href="mailto:support@deetechcomputers.com" className="support-contact-link">
              Send Email
            </a>
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section className="support-services">
        <h2>Our Support Services</h2>
        <div className="support-services-grid">
          <div className="support-service-card">
            <Shield size={32} />
            <h3>Warranty Support</h3>
            <p>Comprehensive warranty services and product protection for all your purchases</p>
          </div>
          <div className="support-service-card">
            <HelpCircle size={32} />
            <h3>Technical Assistance</h3>
            <p>Expert help with setup, troubleshooting, and technical issues</p>
          </div>
          <div className="support-service-card">
            <Truck size={32} />
            <h3>Delivery Support</h3>
            <p>Track your orders and get assistance with nationwide delivery across Ghana</p>
          </div>
          <div className="support-service-card">
            <Users size={32} />
            <h3>Product Consultation</h3>
            <p>Personalized advice to help you choose the perfect tech solution</p>
          </div>
        </div>
      </section>

      {/* Business Hours & Info */}
      <section className="support-business-info">
        <div className="support-info-grid">
          <div className="support-info-card">
            <Clock size={32} className="support-info-icon" />
            <h3>Business Hours</h3>
            <div className="support-hours-list">
              <div className="support-hour-item">
                <span>Monday - Friday:</span>
                <span>8:00 AM - 6:00 PM</span>
              </div>
              <div className="support-hour-item">
                <span>Saturday:</span>
                <span>9:00 AM - 5:00 PM</span>
              </div>
              <div className="support-hour-item">
                <span>Sunday:</span>
                <span>Closed</span>
              </div>
            </div>
          </div>

          <div className="support-info-card">
            <MapPin size={32} className="support-info-icon" />
            <h3>Service Coverage</h3>
            <ul className="support-coverage-list">
              <li>🇬🇭 Kumasi & Ashanti Region(main Office)</li>
              <li>🇬🇭 Available Across Ghana</li>
              <li>🇬🇭 Nationwide Delivery</li>
              <li>🇬🇭 Free Shipping Nationwide</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="support-faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="support-faq-grid">
          <div className="support-faq-item">
            <h3>What is your return policy?</h3>
            <p>
              We offer a 7-day return policy for defective products. Items must be in original 
              condition with all accessories. Contact support to initiate a return.
            </p>
          </div>

          <div className="support-faq-item">
            <h3>Do you offer warranty on products?</h3>
            <p>
              Yes, all our products come with warranty protection. The duration varies by product 
              category. Check product pages for specific warranty details.
            </p>
          </div>

          <div className="support-faq-item">
            <h3>How long does delivery take?</h3>
            <p>
              Within Kumasi: 1-2 hours. Other regions: 8-24 hours hours. 
              Same-day delivery available for urgent orders in Kumasi.
            </p>
          </div>

          <div className="support-faq-item">
            <h3>Do you support bulk orders for businesses?</h3>
            <p>
              Absolutely! We provide customized tech solutions and bulk pricing for businesses 
              and organizations. Contact us for business inquiries.
            </p>
          </div>

          <div className="support-faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>
              We accept mobile money (MTN, Vodafone, Hubtel), bank transfers, and cash on 
              delivery in selected areas.
            </p>
          </div>

          <div className="support-faq-item">
            <h3>Can I get technical support after purchase?</h3>
            <p>
              Yes, we provide comprehensive after-sales support including setup assistance, 
              troubleshooting, and warranty services for all products.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Our Support */}
      <section className="support-features">
        <h2>Why Trust Our Support?</h2>
        <div className="support-features-grid">
          <div className="support-feature-card">
            <Clock size={32} />
            <h3>Fast Response</h3>
            <p>Quick order processing and timely responses to all your inquiries</p>
          </div>
          <div className="support-feature-card">
            <Heart size={32} />
            <h3>Customer First</h3>
            <p>We prioritize your satisfaction with personalized service and support</p>
          </div>
          <div className="support-feature-card">
            <Users size={32} />
            <h3>Expert Team</h3>
            <p>Knowledgeable staff ready to provide the best technical assistance</p>
          </div>
          <div className="support-feature-card">
            <Shield size={32} />
            <h3>Reliable Service</h3>
            <p>Quality guaranteed with comprehensive warranty and after-sales support</p>
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="support-emergency-support">
        <div className="support-emergency-content">
          <h2>Need Immediate Assistance?</h2>
          <p>
            For urgent technical issues or order emergencies, contact us directly for 
            immediate support.
          </p>
          <div className="support-emergency-actions">
            <a href="tel:+233591755964" className="support-btn support-btn-large support-btn-primary">
              <Phone size={20} />
              Call Now: +233 59 175 5964
            </a>
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="support-btn support-btn-large support-btn-secondary"
            >
              <MessageCircle size={20} />
              WhatsApp Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Support;