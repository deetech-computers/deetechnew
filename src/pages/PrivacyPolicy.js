import React from 'react';
import { Shield, Eye, Lock, Database, Users, Mail, Phone, Building } from 'lucide-react';

import '../styles/privacy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      {/* Hero Section */}
      <div className="privacy-hero">
        <div className="privacy-hero-content">
          <Shield size={48} className="privacy-hero-icon" />
          <h1>DEETECH COMPUTERS Privacy Policy</h1>
          <p className="privacy-hero-subtitle">
            Your privacy is our priority. We're committed to protecting your personal information with transparency and care.
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <section className="privacy-overview">
        <div className="privacy-overview-card">
          <Lock size={32} />
          <h3>Data Protection</h3>
          <p>Strict security measures for your information</p>
        </div>
        <div className="privacy-overview-card">
          <Eye size={32} />
          <h3>Transparency</h3>
          <p>Clear about how we use your data</p>
        </div>
        <div className="privacy-overview-card">
          <Database size={32} />
          <h3>Your Rights</h3>
          <p>Control over your personal information</p>
        </div>
      </section>

      {/* About This Policy */}
      <section className="privacy-details">
        <div className="privacy-section">
          <h2>📄 About This Policy</h2>
          
          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Shield size={24} className="privacy-icon-covered" />
              <h3>1. Our Commitment</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Describes how DEETECH COMPUTERS (DEETEK 360 Enterprise) handles personal data</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Covers customers, partners, and job applicants</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Applies to website, online platforms, and all service channels</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>By using our services, you consent to this policy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information We Collect */}
      <section className="privacy-details">
        <div className="privacy-section">
          <h2>📊 The Information We Collect</h2>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Database size={24} className="privacy-icon-covered" />
              <h3>2A. Information You Provide</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Personal Details:</strong> Full name, phone number, email, delivery address</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Payment Information:</strong> Mobile Money or bank transaction confirmations</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Preferences:</strong> Product interests, feedback, inquiries</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Recruitment Data:</strong> Qualifications, experience, employment history</span>
              </div>
            </div>
          </div>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Database size={24} className="privacy-icon-covered" />
              <h3>2B. Automatically Collected</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Device Information:</strong> IP address, browser type, operating system</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Browsing Data:</strong> Pages visited and user interactions</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Location Data:</strong> Only with your consent where applicable</span>
              </div>
            </div>
          </div>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Users size={24} className="privacy-icon-covered" />
              <h3>2C. From Third Parties</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Payment Providers:</strong> Banks, mobile money platforms</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Logistics Partners:</strong> Courier and delivery services</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Recruitment Sources:</strong> Platforms, schools, professional references</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Use Your Information */}
      <section className="privacy-details">
        <div className="privacy-section">
          <h2>🎯 How We Use Your Information</h2>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Eye size={24} className="privacy-icon-covered" />
              <h3>3. Purpose of Data Use</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Processing and confirming product orders</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Facilitating payments and issuing receipts</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Communicating order updates and delivery status</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Managing customer relationships and after-sales service</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Handling warranty claims and product support</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Conducting recruitment and employment processes</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Improving website and customer experience</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Sending promotional offers (with your consent)</span>
              </div>
              <div className="privacy-note">
                <strong>Principle:</strong> We only collect and use data relevant for legitimate business purposes.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sharing & Security */}
      <section className="privacy-details">
        <div className="privacy-section">
          <h2>🔒 Data Protection</h2>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Users size={24} className="privacy-icon-covered" />
              <h3>4. How We Share Information</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Service Providers:</strong> Delivery companies, payment processors</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Technical Partners:</strong> IT systems and website management</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Authorities:</strong> When legally required</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Recruitment Partners:</strong> Employment-related processes</span>
              </div>
              <div className="privacy-note">
                <strong>Protection:</strong> Partners adhere to confidentiality standards and data is only used for specific purposes.
              </div>
            </div>
          </div>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Lock size={24} className="privacy-icon-covered" />
              <h3>5. Data Security</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Strict security measures to prevent unauthorized access</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Restricted access to authorized personnel only</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Confidentiality agreements with all service providers</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Continuous system monitoring for potential breaches</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span>Prompt notification in case of data breaches as required by law</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights & Contact */}
      <section className="privacy-details">
        <div className="privacy-section">
          <h2>👤 Your Rights & Contact</h2>

          <div className="privacy-card privacy-covered">
            <div className="privacy-header">
              <Database size={24} className="privacy-icon-covered" />
              <h3>6. Your Rights</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Access:</strong> View the personal data we hold about you</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Correction:</strong> Request updates to inaccurate information</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Deletion:</strong> Request removal when no longer necessary</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Objection:</strong> Restrict processing in certain cases</span>
              </div>
              <div className="privacy-covered-item">
                <Shield size={20} className="privacy-icon-covered" />
                <span><strong>Withdraw Consent:</strong> Opt-out of promotional communications</span>
              </div>
            </div>
          </div>

          <div className="privacy-card">
            <div className="privacy-header">
              <Mail size={24} />
              <h3>7. Contact & Details</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-contact-details">
                <div className="privacy-contact-item">
                  <strong>Data Protection Officer</strong>
                </div>
                <div className="privacy-contact-item">
                  <Mail size={16} />
                  <span>Email: deetechcomputers01@gmail.com</span>
                </div>
                <div className="privacy-contact-item">
                  <Phone size={16} />
                  <span>Phone: 0591755964</span>
                </div>
                <div className="privacy-contact-item">
                  <Building size={16} />
                  <span>Business: DEETECH COMPUTERS (DEETEK 360 Enterprise)</span>
                </div>
              </div>
              <p className="privacy-note">We respond promptly to all privacy-related inquiries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="privacy-important-notes">
        <div className="privacy-notes-card">
          <Shield size={32} className="privacy-warning-icon" />
          <h3>Additional Information</h3>
          <div className="privacy-notes-list">
            <div className="privacy-note-item">
              <strong>🌍 International Transfers</strong>
              <p>Your data may be transferred internationally with protection in line with Ghanaian data protection laws</p>
            </div>
            <div className="privacy-note-item">
              <strong>💾 Data Retention</strong>
              <p>We retain data only as long as necessary for legal, accounting, or service purposes</p>
            </div>
            <div className="privacy-note-item">
              <strong>🔄 Policy Updates</strong>
              <p>We may update this policy periodically to reflect business or legal changes</p>
            </div>
            <div className="privacy-note-item">
              <strong>🔐 Secure Deletion</strong>
              <p>When data is no longer needed, it is securely deleted or anonymized</p>
            </div>
          </div>
        </div>
      </section>

     {/* Contact CTA */}
      <section className="privacy-about-cta">
        <div className="privacy-cta-content">
          <h2>Need Privacy Assistance?</h2>
          <p>Contact our Data Protection Officer for any privacy concerns or to exercise your rights.</p>
          <div className="privacy-cta-actions">
            <a 
              href="mailto:deetechcomputers01@gmail.com" 
              className="privacy-btn privacy-btn-large"
            >
              Email Data Protection Officer
            </a>
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="privacy-btn privacy-btn-secondary"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;