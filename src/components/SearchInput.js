import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import '../styles/search-input.css';

const SearchInput = ({ 
  value, 
  onChange, 
  onSearch, // New prop for actual search execution
  placeholder = "Search products...",
  className = "",
  onClear,
  autoFocus = false,
  minChars = 3, // Reduced to 3 for better UX
  delay = 15000, // 15 seconds delay before auto-search
  showTimer = true // Optional: show countdown timer
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const currentValueRef = useRef(inputValue);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value || '');
    currentValueRef.current = value || '';
  }, [value]);

  // Start countdown timer
  const startTimer = useCallback((searchValue) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setTimeLeft(delay / 1000); // Convert to seconds
    setIsActive(true);

    // Start countdown interval
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start the actual search timer
    timerRef.current = setTimeout(() => {
      const currentValue = currentValueRef.current;
      if (currentValue.trim().length >= minChars || currentValue.trim() === '') {
        setIsTyping(false);
        setIsActive(false);
        onSearch?.(currentValue.trim());
      }
      clearInterval(countdownRef.current);
      setTimeLeft(0);
    }, delay);
  }, [delay, minChars, onSearch]);

  const handleInputChange = useCallback((newValue) => {
    setInputValue(newValue);
    currentValueRef.current = newValue;
    setIsTyping(true);
    
    // Call onChange immediately for responsive UI
    onChange?.(newValue);
    
    // Start or reset the timer only if we have enough characters
    if (newValue.trim().length >= minChars || newValue.trim() === '') {
      startTimer(newValue);
    } else {
      // Clear timer if not enough characters
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setIsActive(false);
      setTimeLeft(0);
    }
  }, [onChange, minChars, startTimer]);

  const handleClear = useCallback(() => {
    setInputValue('');
    currentValueRef.current = '';
    setIsTyping(false);
    setIsActive(false);
    setTimeLeft(0);
    
    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    onChange?.('');
    onSearch?.('');
    onClear?.();
  }, [onChange, onSearch, onClear]);

  const handleKeyPress = useCallback((e) => {
    // Allow manual search with Enter key
    if (e.key === 'Enter') {
      // Clear any pending timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      
      setIsTyping(false);
      setIsActive(false);
      setTimeLeft(0);
      onSearch?.(inputValue.trim());
    }
  }, [inputValue, onSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Clear timer when component unmounts or when value changes from parent
  useEffect(() => {
    // If parent value changes to empty, clear timers
    if (value === '' && inputValue !== '') {
      handleClear();
    }
  }, [value, inputValue, handleClear]);

  return (
    <div className={`search-input-container ${className}`}>
      <div className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus={autoFocus}
        />
        {inputValue && (
          <div className="search-controls">
            {isActive && showTimer && (
              <div className="search-timer" aria-label={`Searching in ${timeLeft} seconds`}>
                <Clock size={14} />
                <span className="timer-text">{timeLeft}s</span>
              </div>
            )}
            {isTyping && !isActive && (
              <span className="typing-indicator" aria-label="Typing...">
                ...
              </span>
            )}
            <button 
              className="clear-search-btn"
              onClick={handleClear}
              aria-label="Clear search"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Helper text */}
      {inputValue.length > 0 && inputValue.length < minChars && (
        <div className="search-hint">
          Type at least {minChars} characters to search (auto-searches in 15 seconds)
        </div>
      )}
      
      {/* Timer explanation - Only show when typing and has enough chars */}
      {isActive && inputValue.trim().length >= minChars && (
        <div className="timer-explanation">
                </div>
      )}
    </div>
  );
};

export default SearchInput;