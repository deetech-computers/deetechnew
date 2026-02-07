import React from 'react';
import { Users, Target, Award, Shield, Clock, Heart } from 'lucide-react';

import '../styles/about.css';

const About = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-hero-content">
          <h1>About DEETECH COMPUTERS</h1>
          <p className="about-hero-subtitle">
            Your Trusted Technology Partner in Ghana
          </p>
          <p className="about-hero-description">
            Since our inception, DEETECH COMPUTERS has been committed to providing 
            high-quality computers, laptops, phones, and accessories to individuals 
            and businesses across Ghana. We bridge the gap between technology and 
            everyday life with reliable products and exceptional service.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="about-mission-vision">
        <div className="about-mission-card">
          <Target size={48} className="about-mission-icon" />
          <h2>Our Mission</h2>
          <p>
            To empower Ghanaians with accessible, reliable, and affordable technology 
            solutions that enhance productivity, education, and entertainment while 
            providing exceptional customer service and support.
          </p>
        </div>
        <div className="about-vision-card">
          <Award size={48} className="about-vision-icon" />
          <h2>Our Vision</h2>
          <p>
            To become Ghana's most trusted technology retailer, known for quality products, 
            competitive pricing, and outstanding customer care that transforms how people 
            interact with technology.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="about-what-we-do">
        <h2>What We Do</h2>
        <div className="about-services-grid">
          <div className="about-service-card">
            <div className="about-service-icon">💻</div>
            <h3>Computer Sales</h3>
            <p>Laptops, desktops, and workstations for every need and budget</p>
          </div>
          <div className="about-service-card">
            <div className="about-service-icon">📱</div>
            <h3>Mobile Devices</h3>
            <p>Smartphones and tablets from leading brands at competitive prices</p>
          </div>
          <div className="about-service-card">
            <div className="about-service-icon">🖥️</div>
            <h3>Accessories</h3>
            <p>Monitors, keyboards, mice, and all essential computer peripherals</p>
          </div>
          <div className="about-service-card">
            <div className="about-service-icon">🛡️</div>
            <h3>Technical Support</h3>
            <p>Warranty services, repairs, and technical assistance for all products</p>
          </div>
          <div className="about-service-card">
            <div className="about-service-icon">💼</div>
            <h3>Business Solutions</h3>
            <p>Bulk orders and customized tech solutions for businesses and organizations</p>
          </div>
          <div className="about-service-card">
            <div className="about-service-icon">🚚</div>
            <h3>Nationwide Delivery</h3>
            <p>Free delivery across Ghana with secure and timely shipping</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="about-why-choose-us">
        <div className="about-why-choose-header">
          <h2>Why Choose DEETECH COMPUTERS?</h2>
          <p className="about-section-intro">
            We're committed to providing exceptional value through quality products, 
            reliable service, and customer-focused solutions.
          </p>
        </div>
        <div className="about-features-horizontal">
          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper">
              <Shield size={28} />
            </div>
            <div className="about-feature-content">
              <h3>Quality Guaranteed</h3>
              <p>All our products undergo thorough quality checks and come with warranty protection</p>
            </div>
          </div>
          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper">
              <Clock size={28} />
            </div>
            <div className="about-feature-content">
              <h3>Fast Service</h3>
              <p>Quick order processing and nationwide delivery to get you your tech faster</p>
            </div>
          </div>
          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper">
              <Heart size={28} />
            </div>
            <div className="about-feature-content">
              <h3>Customer First</h3>
              <p>We prioritize your satisfaction with personalized service and after-sales support</p>
            </div>
          </div>
          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper">
              <Users size={28} />
            </div>
            <div className="about-feature-content">
              <h3>Expert Advice</h3>
              <p>Knowledgeable staff ready to help you choose the perfect tech solution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="about-our-values">
        <h2>Our Core Values</h2>
        <div className="about-values-container">
          <div className="about-value-item">
            <div className="about-value-number">01</div>
            <h3>Integrity</h3>
            <p>We believe in honest business practices, transparent pricing, and building trust with every customer interaction.</p>
          </div>
          <div className="about-value-item">
            <div className="about-value-number">02</div>
            <h3>Quality</h3>
            <p>From product selection to customer service, we maintain the highest standards in everything we do.</p>
          </div>
          <div className="about-value-item">
            <div className="about-value-number">03</div>
            <h3>Innovation</h3>
            <p>We stay current with technology trends to bring you the latest and most reliable products.</p>
          </div>
          <div className="about-value-item">
            <div className="about-value-number">04</div>
            <h3>Community</h3>
            <p>We're proud to serve Ghanaian communities and contribute to technological advancement in our nation.</p>
          </div>
        </div>
      </section>

   {/* Final Call to Action */}
<section className="about-final-cta">
  <div className="about-cta-wrapper">
    <div className="about-cta-inner">
      <h2>Ready to Find Your Perfect Tech Solution?</h2>
      <p className="about-cta-description">
        Browse our products or contact us for personalized recommendations
      </p>
      <div className="about-cta-buttons">
        <a href="/products" className="about-cta-btn about-cta-btn-primary">
          Shop Products
        </a>
        <a 
          href="https://wa.me/233591755964" 
          target="_blank" 
          rel="noopener noreferrer"
          className="about-cta-btn about-cta-btn-secondary"
        >
          Contact Us
        </a>
      </div>
    </div>
  </div>
</section>
    </div>
  );
};

export default About;