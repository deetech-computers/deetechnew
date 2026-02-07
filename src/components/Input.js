import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import '../styles/input.css';

const Input = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error = '',
  success = '',
  icon: Icon,
  validation = null,
  showPasswordToggle = false,
  helpText,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasValidation = validation && value;
  const isValid = hasValidation ? validation.isValid : null;
  const validationMessage = hasValidation ? validation.message : '';

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Filter out custom props that shouldn't go to DOM elements
  const getInputProps = () => {
    const inputProps = { ...props };
    
    // Remove custom props that React will complain about
    const excludedProps = [
      'helpText',
      'validation',
      'showPasswordToggle',
      'icon'
    ];
    
    excludedProps.forEach(prop => {
      delete inputProps[prop];
    });
    
    return inputProps;
  };

  return (
    <div className={`login-input-group ${className}`}>
      {label && (
        <label htmlFor={props.id} className="login-input-label">
          {label}
          {required && <span className="login-input-required-asterisk">*</span>}
        </label>
      )}

      <div className={`login-input-container ${isFocused ? 'login-input-focused' : ''} ${disabled ? 'login-input-disabled' : ''} ${error ? 'login-input-error' : ''} ${success ? 'login-input-success' : ''}`}>
        {Icon && (
          <div className="login-input-icon">
            <Icon size={18} />
          </div>
        )}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`login-input-field ${Icon ? 'login-input-with-icon' : ''} ${showPasswordToggle ? 'login-input-with-password-toggle' : ''}`}
          {...getInputProps()}
        />

        {/* Password Toggle */}
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="login-input-password-toggle-btn"
            onClick={togglePasswordVisibility}
            disabled={disabled || !value}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Validation Indicator */}
        {hasValidation && (
          <div className={`login-input-validation-indicator ${isValid ? 'login-input-valid' : 'login-input-invalid'}`}>
            {isValid ? (
              <CheckCircle size={18} className="login-input-validation-icon" />
            ) : (
              <XCircle size={18} className="login-input-validation-icon" />
            )}
          </div>
        )}
      </div>

      {/* Validation Message */}
      {hasValidation && validationMessage && (
        <div className={`login-input-validation-message ${isValid ? 'login-input-valid' : 'login-input-invalid'}`}>
          {validationMessage}
        </div>
      )}

      {/* Error Message */}
      {error && !hasValidation && (
        <div className="login-input-error-message">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && !hasValidation && (
        <div className="login-input-success-message">
          {success}
        </div>
      )}

      {/* Help Text */}
      {helpText && (
        <div className="login-input-help-text">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default Input;