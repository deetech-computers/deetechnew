import React from 'react';
import { Truck, Shield, RotateCcw, Star } from 'lucide-react';

const ProductFeatures = () => (
  <div className="product-features">
    <div className="feature-item">
      <Truck size={20} />
      <div className="feature-text">
        <strong>Free Shipping</strong>
        <span>Accra &amp; Kumasi</span>
      </div>
    </div>
    <div className="feature-item">
      <Shield size={20} />
      <div className="feature-text">
        <strong>1 Year Warranty</strong>
        <span>Quality Guaranteed</span>
      </div>
    </div>
    <div className="feature-item">
      <RotateCcw size={20} />
      <div className="feature-text">
        <strong>7-Day Returns</strong>
        <span>Easy Returns</span>
      </div>
    </div>
    <div className="feature-item">
      <Star size={20} />
      <div className="feature-text">
        <strong>Premium Support</strong>
        <span>24/7 Help Center</span>
      </div>
    </div>
  </div>
);

export default React.memo(ProductFeatures);