import React, { useState } from 'react';
import { FileText, Shield, User, CreditCard, Package, Clock, AlertTriangle, Mail, Phone, MessageCircle, ArrowUp, Globe } from 'lucide-react';
import '../styles/termsofuse.css';

const TermsOfUse = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top button when scrolled down
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="terms-container">
      {/* Hero Section */}
      <div className="terms-hero">
        <div className="terms-hero-content">
          <FileText size={48} className="terms-hero-icon" />
          <h1>DEETECH COMPUTERS Terms of Use</h1>
          <p className="terms-hero-subtitle">
            Please read these terms carefully before using our website, services, or products.
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="terms-last-updated">
        <Clock size={16} />
        <span>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* Quick Overview */}
      <section className="terms-overview">
        <div className="terms-overview-card">
          <User size={32} />
          <h3>User Responsibilities</h3>
          <p>Your obligations when using our platform</p>
        </div>
        <div className="terms-overview-card">
          <CreditCard size={32} />
          <h3>Secure Transactions</h3>
          <p>Safe and authorized payments only</p>
        </div>
        <div className="terms-overview-card">
          <Shield size={32} />
          <h3>Your Protection</h3>
          <p>Clear terms for your security</p>
        </div>
      </section>

      {/* Acceptance & User Responsibilities */}
      <section className="terms-details" aria-labelledby="terms-overview">
        <div className="terms-section">
          <h2 id="terms-overview">📝 Terms Overview</h2>
          
          <div className="terms-card terms-covered">
            <div className="terms-header">
              <FileText size={24} className="terms-icon-covered" />
              <h3>1. Acceptance of Terms</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>By accessing or using our website, services, or products, you agree to be bound by these Terms of Use</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>If you disagree with any part of these terms, please discontinue use immediately</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Continued use after changes constitutes acceptance of modified terms</span>
              </div>
            </div>
          </div>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <User size={24} className="terms-icon-covered" />
              <h3>2. User Responsibilities</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Maintain confidentiality and security of your account credentials</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Use the platform only for lawful purposes and in compliance with applicable laws</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Provide accurate, complete, and current information in all interactions</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Refrain from posting misleading, harmful, inappropriate, or infringing content</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Not engage in any activity that could disrupt or interfere with our services</span>
              </div>
              <div className="terms-note">
                <strong>Note:</strong> We reserve the right to review, edit, or remove content that violates our policies and to suspend or terminate accounts for violations.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transactions & Payments */}
      <section className="terms-details" aria-labelledby="transactions-payments">
        <div className="terms-section">
          <h2 id="transactions-payments">💳 Transactions & Payments</h2>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <CreditCard size={24} className="terms-icon-covered" />
              <h3>3. Secure Transactions</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span><strong>Official Channels Only:</strong> Use only our verified agents or authorized merchant accounts</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span><strong>Currency:</strong> All payments must be made in the specified website or invoice currency</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span><strong>No Responsibility:</strong> We are not liable for payments made to unauthorized third parties</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span><strong>Fees:</strong> Customers are responsible for any payment processing fees or bank charges</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span><strong>Receipts:</strong> Official receipts are issued only after payment confirmation and verification</span>
              </div>
              <div className="terms-covered-item">
                <AlertTriangle size={20} className="terms-icon-not-covered" />
                <span><strong>Fraud Prevention:</strong> Fraudulent transactions will result in immediate account suspension and may lead to legal action</span>
              </div>
            </div>
          </div>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <Package size={24} className="terms-icon-covered" />
              <h3>4. Product Availability & Pricing</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>All prices, product specifications, and availability are subject to change without prior notice</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We reserve the right to correct any errors in pricing or product descriptions at any time</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Orders may be canceled or quantity adjusted in cases of incorrect pricing or insufficient stock</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Promotional offers and discounts are subject to specific terms and expiration dates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping & Legal */}
      <section className="terms-details" aria-labelledby="shipping-legal">
        <div className="terms-section">
          <h2 id="shipping-legal">🚚 Shipping & Legal</h2>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <Package size={24} className="terms-icon-covered" />
              <h3>5. Shipping and Delivery</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Delivery timelines provided are estimates only and may vary based on location and circumstances</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We are not liable for delays caused by courier services, weather conditions, or unforeseen circumstances</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Customers must inspect packages for visible damage upon delivery and before signing</span>
              </div>
              <div className="terms-covered-item">
                <Clock size={20} className="terms-icon-covered" />
                <span>Report any delivery discrepancies, damages, or missing items within 48 hours of receipt</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Shipping costs may vary based on destination, package weight, and delivery speed</span>
              </div>
            </div>
          </div>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <User size={24} className="terms-icon-covered" />
              <h3>6. Age Restrictions</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Users under 18 years of age require parental or guardian consent to use our services</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We do not knowingly collect personal data from minors without verified parental consent</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Parents or guardians are responsible for monitoring their children's use of our services</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intellectual Property & Liability */}
      <section className="terms-details" aria-labelledby="legal-ip">
        <div className="terms-section">
          <h2 id="legal-ip">⚖️ Legal & Intellectual Property</h2>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <FileText size={24} className="terms-icon-covered" />
              <h3>7. Intellectual Property</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>All website content, including text, graphics, logos, and software, is the exclusive property of DEETECH COMPUTERS</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>No content may be copied, reproduced, modified, distributed, or used without express written permission</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Third-party trademarks and logos remain the property of their respective owners</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Unauthorized use may result in legal action for copyright or trademark infringement</span>
              </div>
            </div>
          </div>

          <div className="terms-card terms-not-covered">
            <div className="terms-header">
              <AlertTriangle size={24} className="terms-icon-not-covered" />
              <h3>8. Limitation of Liability</h3>
            </div>
            <div className="terms-content">
              <div className="terms-not-covered-item">
                <AlertTriangle size={20} className="terms-icon-not-covered" />
                <span>DEETECH COMPUTERS shall not be liable for any indirect, incidental, or consequential damages</span>
              </div>
              <div className="terms-not-covered-item">
                <AlertTriangle size={20} className="terms-icon-not-covered" />
                <span>Not liable for loss of data, profits, revenue, or business opportunities arising from service use</span>
              </div>
              <div className="terms-not-covered-item">
                <AlertTriangle size={20} className="terms-icon-not-covered" />
                <span>Not liable for service interruptions, unauthorized access, or data breaches beyond our reasonable control</span>
              </div>
              <div className="terms-not-covered-item">
                <AlertTriangle size={20} className="terms-icon-not-covered" />
                <span>Total liability shall not exceed the amount paid by you for the specific product or service in question</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service & Modifications */}
      <section className="terms-details" aria-labelledby="service-modifications">
        <div className="terms-section">
          <h2 id="service-modifications">🔧 Service & Modifications</h2>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <AlertTriangle size={24} className="terms-icon-covered" />
              <h3>9. Service Modifications & Termination</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We reserve the right to modify, suspend, or discontinue any service at any time without prior notice</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Not liable for any modification, suspension, or discontinuation of services</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Users may terminate their account at any time by contacting customer support</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We may terminate or suspend access immediately for violations of these terms</span>
              </div>
            </div>
          </div>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <Globe size={24} className="terms-icon-covered" />
              <h3>10. Governing Law & Dispute Resolution</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>These terms are governed by and construed in accordance with the laws of Ghana</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Any disputes shall first be attempted to be resolved through good-faith negotiation</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Unresolved disputes may be submitted to the competent courts of Ghana</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Users agree to submit to the personal jurisdiction of Ghanaian courts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Data */}
      <section className="terms-details" aria-labelledby="privacy-data">
        <div className="terms-section">
          <h2 id="privacy-data">🔒 Privacy & Data</h2>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <Shield size={24} className="terms-icon-covered" />
              <h3>11. Privacy & Data Protection</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>Your use of our services is subject to our Privacy Policy, which is incorporated by reference</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We collect and use personal data as described in our Privacy Policy</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>We implement reasonable security measures to protect your personal information</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>By using our services, you consent to the collection and use of data as outlined in our Privacy Policy</span>
              </div>
            </div>
          </div>

          <div className="terms-card terms-covered">
            <div className="terms-header">
              <FileText size={24} className="terms-icon-covered" />
              <h3>12. Severability & Entire Agreement</h3>
            </div>
            <div className="terms-content">
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>If any provision of these terms is found to be invalid or unenforceable, the remaining provisions remain in full effect</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>These Terms of Use constitute the entire agreement between you and DEETECH COMPUTERS</span>
              </div>
              <div className="terms-covered-item">
                <Shield size={20} className="terms-icon-covered" />
                <span>No waiver of any term shall be deemed a further or continuing waiver of such term</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="terms-important-notes">
        <div className="terms-notes-card">
          <AlertTriangle size={32} className="terms-warning-icon" />
          <h3>Important Information</h3>
          <div className="terms-notes-list">
            <div className="terms-note-item">
              <strong>🚨 Report Issues</strong>
              <p>Report unlawful activity, security concerns, or policy violations immediately to deetechcomputers01@gmail.com</p>
            </div>
            <div className="terms-note-item">
              <strong>⏸️ Account Termination</strong>
              <p>We may suspend or terminate accounts for violations, fraudulent activities, or unlawful conduct without prior notice</p>
            </div>
            <div className="terms-note-item">
              <strong>🔄 Terms Updates</strong>
              <p>Terms may be updated periodically; continued use after changes means acceptance of modified terms</p>
            </div>
            <div className="terms-note-item">
              <strong>🔒 Secure Payments</strong>
              <p>Only use official payment channels and verify agent credentials to avoid fraud</p>
            </div>
            <div className="terms-note-item">
              <strong>📞 Contact Verification</strong>
              <p>Always verify contact details through our official website before making payments or sharing sensitive information</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="terms-about-cta">
        <div className="terms-cta-content">
          <h2>Questions About Our Terms?</h2>
          <p>Contact us for any clarification about our Terms of Use or to report any concerns.</p>
          
          <div className="terms-contact-methods">
            <div className="terms-contact-method">
              <Mail size={20} />
              <span>Email: deetechcomputers01@gmail.com</span>
            </div>
            <div className="terms-contact-method">
              <Phone size={20} />
              <span>Phone: +233 059 175 5964</span>
            </div>
            <div className="terms-contact-method">
              <MessageCircle size={20} />
              <span>WhatsApp: +233 059 175 5964</span>
            </div>
          </div>
          
          <div className="terms-cta-actions">
            <a 
              href="mailto:deetechcomputers01@gmail.com" 
              className="terms-btn terms-btn-primary"
            >
              <Mail size={20} />
              Email Support
            </a>
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="terms-btn terms-btn-secondary"
            >
              <MessageCircle size={20} />
              WhatsApp Support
            </a>
          </div>
          
          <div className="terms-response-time">
            <Clock size={16} />
            <span>Typically respond within 24 hours during business days</span>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button 
          className="terms-scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default TermsOfUse;