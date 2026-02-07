// components/ComparisonBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { X, BarChart3 } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';

const ComparisonBar = () => {
  const { comparisonItems, removeFromComparison, clearComparison } = useComparison();

  if (comparisonItems.length === 0) return null;

  return (
    <div className="comparison-scope__bar">
      <div className="comparison-scope__bar-content">
        <div className="comparison-scope__header">
          <BarChart3 size={20} />
          <span>Comparing Products ({comparisonItems.length}/2)</span>
        </div>
        
        <div className="comparison-scope__items">
          {comparisonItems.map(product => (
            <div key={product.id} className="comparison-scope__item">
              <img 
                src={product.image_url || '/api/placeholder/60/60'} 
                alt={product.name}
                className="comparison-scope__item-image"
              />
              <div className="comparison-scope__item-info">
                <span className="comparison-scope__item-name">{product.name}</span>
                <span className="comparison-scope__item-price">
                  GH₵ {parseFloat(product.price).toLocaleString()}
                </span>
              </div>
              <button
                className="comparison-scope__remove-btn"
                onClick={() => removeFromComparison(product.id)}
                title="Remove from comparison"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="comparison-scope__actions">
          {comparisonItems.length === 2 && (
            <Link to="/compare" className="btn btn-small btn-primary">
              Compare Now
            </Link>
          )}
          <button 
            onClick={clearComparison}
            className="btn btn-small btn-secondary"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;