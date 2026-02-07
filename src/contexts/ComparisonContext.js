// contexts/ComparisonContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const ComparisonContext = createContext();

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

export const ComparisonProvider = ({ children }) => {
  const [comparisonProducts, setComparisonProducts] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const MAX_COMPARE_ITEMS = 4; // Limit to 4 products for better UI

  // Load comparison from localStorage on mount
  useEffect(() => {
    const savedComparison = localStorage.getItem('deetech-comparison');
    if (savedComparison) {
      try {
        const parsed = JSON.parse(savedComparison);
        setComparisonProducts(parsed);
        setIsComparing(parsed.length > 0);
      } catch (error) {
        console.error('Error loading comparison:', error);
        localStorage.removeItem('deetech-comparison');
      }
    }
  }, []);

  // Save comparison to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('deetech-comparison', JSON.stringify(comparisonProducts));
    setIsComparing(comparisonProducts.length > 0);
  }, [comparisonProducts]);

  const addToComparison = useCallback((product) => {
    setComparisonProducts(prev => {
      // Check if product already exists
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev; // Already in comparison
      }
      
      // Check if we've reached the limit
      if (prev.length >= MAX_COMPARE_ITEMS) {
        // Remove the oldest product (first in array)
        const updated = [...prev.slice(1), product];
        return updated;
      }
      
      // Add new product
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback((productId) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
  }, []);

  const isInComparison = useCallback((productId) => {
    return comparisonProducts.some(p => p.id === productId);
  }, [comparisonProducts]);

  const getComparisonCount = useCallback(() => {
    return comparisonProducts.length;
  }, [comparisonProducts]);

  return (
    <ComparisonContext.Provider value={{
      comparisonProducts,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison,
      getComparisonCount,
      isComparing,
      MAX_COMPARE_ITEMS
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};