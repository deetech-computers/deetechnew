import React from 'react';
import { Search, X } from 'lucide-react';
import '../styles/faq-search.css';

const FAQSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search for answers...",
  className = "" 
}) => {
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={`faq-search-container ${className}`}>
      <div className="faq-search-input-wrapper">
        <Search size={20} className="faq-search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="faq-search-input"
        />
        {searchTerm && (
          <button 
            onClick={clearSearch}
            className="faq-search-clear"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FAQSearch;