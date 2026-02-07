// components/LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css'; // Optional CSS file

const LoadingSpinner = ({ size = 'medium', color = 'primary', className = '' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium', 
    large: 'spinner-large'
  };

  const colorClasses = {
    primary: 'spinner-primary',
    white: 'spinner-white',
    dark: 'spinner-dark'
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

export default LoadingSpinner;