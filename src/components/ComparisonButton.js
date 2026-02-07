// components/ComparisonButton.js
import React, { useState } from 'react';
import { BarChart3, X, Check } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';

const ComparisonButton = ({ product, size = 'medium', showLabel = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { 
    comparisonItems, 
    addToComparison, 
    removeFromComparison, 
    canAddMore 
  } = useComparison();

  const isInComparison = comparisonItems.some(item => item.id === product.id);

  const handleToggleComparison = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isInComparison) {
        await removeFromComparison(product.id);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      } else {
        if (!canAddMore) {
          throw new Error('You can only compare 2 products at a time. Remove one to add another.');
        }
        await addToComparison(product);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonClass = () => {
    const baseClass = `comparison-scope__btn comparison-scope__btn--${size} ${isInComparison ? 'comparison-scope__btn--in-comparison' : ''} ${isLoading ? 'comparison-scope__btn--loading' : ''}`;
    return baseClass;
  };

  const getButtonText = () => {
    if (showFeedback) {
      return isInComparison ? 'Added!' : 'Removed!';
    }
    return isInComparison ? 'In Comparison' : 'Compare';
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleToggleComparison}
      disabled={isLoading}
      title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
    >
      {showFeedback ? (
        <Check size={size === 'small' ? 14 : 18} />
      ) : isInComparison ? (
        <X size={size === 'small' ? 14 : 18} />
      ) : (
        <BarChart3 size={size === 'small' ? 14 : 18} />
      )}
      
      {showLabel && (
        <span className="comparison-scope__btn-text">
          {getButtonText()}
        </span>
      )}
      
      {isLoading && <div className="comparison-scope__spinner"></div>}
    </button>
  );
};

export default ComparisonButton;