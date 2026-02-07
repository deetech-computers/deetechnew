import React from 'react';
import { Shield, Check, X, AlertTriangle, Clock, Package, Settings, Phone } from 'lucide-react';
import '../styles/warranty.css';

const Warranty = () => {
  return (
    <div className="warranty-container">
      <div className="warranty-hero">
        <div className="warranty-hero-content">
          <Shield size={48} className="warranty-hero-icon" />
          <h1>DEETECH Computers Warranty</h1>
          <p className="warranty-hero-subtitle">
            Your peace of mind is our priority. We stand behind the quality of every product we sell.
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <section className="warranty-overview">
        <div className="warranty-overview-card">
          <Clock size={32} />
          <h3>30-Day Limited Warranty</h3>
          <p>Comprehensive coverage on all laptops and computers</p>
        </div>
        <div className="warranty-overview-card">
          <Settings size={32} />
          <h3>Professional Service</h3>
          <p>Expert technicians and genuine parts</p>
        </div>
        <div className="warranty-overview-card">
          <Phone size={32} />
          <h3>Quick Support</h3>
          <p>Fast claim processing and communication</p>
        </div>
      </section>

      {/* Warranty Details */}
      <section className="warranty-details">
        <div className="warranty-section">
          <h2>🛡️ DEETECH Computers Laptop Warranty Terms</h2>
          
          <div className="warranty-card">
            <div className="warranty-header">
              <Clock size={24} />
              <h3>Warranty Duration</h3>
            </div>
            <div className="warranty-content">
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>30 Days Limited Warranty</strong> on all laptops and computers</span>
              </div>
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>15 Days Warranty</strong> on phones and tablets</span>
              </div>
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>7 Days Warranty</strong> on accessories and peripherals</span>
              </div>
              <p className="warranty-note">*Warranty period starts from the date of purchase</p>
            </div>
          </div>

          <div className="warranty-card warranty-covered">
            <div className="warranty-header">
              <Check size={24} className="warranty-icon-covered" />
              <h3>What's Covered</h3>
            </div>
            <div className="warranty-content">
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>Power issues</strong> not caused by misuse or power surges</span>
              </div>
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>Sudden boot failure</strong> or system not powering on</span>
              </div>
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>Charging port malfunctions</strong> or internal hardware failures</span>
              </div>
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>Manufacturing defects</strong> in internal components</span>
              </div>
              <div className="warranty-covered-item">
                <Check size={20} className="warranty-icon-covered" />
                <span><strong>Faulty RAM, HDD/SSD, or motherboard</strong> issues</span>
              </div>
            </div>
          </div>

          <div className="warranty-card warranty-not-covered">
            <div className="warranty-header">
              <X size={24} className="warranty-icon-not-covered" />
              <h3>What's Not Covered</h3>
            </div>
            <div className="warranty-content">
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Physical damage</strong> - broken screens, body cracks, dents, or cosmetic issues</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Liquid damage</strong> - water, spills, or moisture-related issues</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Software issues</strong> caused by user (viruses, OS crashes, third-party apps)</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Battery life reduction</strong> or normal wear and tear</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Charger faults</strong> after normal usage period</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Unauthorized repairs</strong> or tampering with manufacturer seals</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Overheating</strong> due to environmental conditions or improper use</span>
              </div>
              <div className="warranty-not-covered-item">
                <X size={20} className="warranty-icon-not-covered" />
                <span><strong>Theft, loss, or accidental damage</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Process */}
      <section className="warranty-process">
        <h2>Warranty Claim Process</h2>
        <div className="warranty-process-steps">
          <div className="warranty-process-step">
            <div className="warranty-step-number">1</div>
            <h3>Contact Support</h3>
            <p>Reach out to us via WhatsApp or phone with your purchase details and issue description</p>
          </div>
          <div className="warranty-process-step">
            <div className="warranty-step-number">2</div>
            <h3>Inspection</h3>
            <p>Bring the product to our service center for professional diagnosis and assessment</p>
          </div>
          <div className="warranty-process-step">
            <div className="warranty-step-number">3</div>
            <h3>Approval</h3>
            <p>We'll determine if the issue is covered under warranty and provide repair timeline</p>
          </div>
          <div className="warranty-process-step">
            <div className="warranty-step-number">4</div>
            <h3>Resolution</h3>
            <p>Repair or replacement with available parts. You'll be notified when ready for pickup</p>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="warranty-important-notes">
        <div className="warranty-notes-card">
          <AlertTriangle size={32} className="warranty-warning-icon" />
          <h3>Important Information</h3>
          <div className="warranty-notes-list">
            <div className="warranty-note-item">
              <strong>🛠️ All warranty claims are subject to inspection</strong>
              <p>Our technicians will thoroughly examine the product to determine the cause of failure</p>
            </div>
            <div className="warranty-note-item">
              <strong>🔧 Repair or replacement</strong>
              <p>If repairs are approved, we will fix the issue or replace with available equivalent parts</p>
            </div>
            <div className="warranty-note-item">
              <strong>📦 Return condition</strong>
              <p>Customer must return the product in its original condition with all accessories</p>
            </div>
            <div className="warranty-note-item">
              <strong>📝 Proof of purchase required</strong>
              <p>Keep your receipt/invoice as proof of purchase date and warranty validity</p>
            </div>
            <div className="warranty-note-item">
              <strong>⏰ Repair timeframe</strong>
              <p>Most repairs are completed within 7-14 business days, depending on parts availability</p>
            </div>
          </div>
        </div>
      </section>

    {/* Contact CTA */}
      <section className="warranty-about-cta">
        <div className="warranty-cta-content">
          <h2>Our team is ready to assist you with any warranty claims or technical support.</h2>
          <p>For any warranty related issues or assistance, please reach out to us via WhatsApp</p>
          <div className="warranty-cta-actions">
            <a 
              href="https://wa.me/233591755964" 
              target="_blank" 
              rel="noopener noreferrer"
              className="warranty-btn warranty-btn-secondary"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Warranty;