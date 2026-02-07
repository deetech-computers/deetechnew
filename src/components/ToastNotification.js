import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './ToastNotification.css'; // Add this CSS file

const ToastNotification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon" size={20} />;
      case 'warning':
        return <AlertCircle className="toast-icon" size={20} />;
      case 'info':
        return <Info className="toast-icon" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        <div className="toast-icon-container">
          {getIcon()}
        </div>
        <span className="toast-message">{message}</span>
        <button 
          onClick={onClose} 
          className="toast-close"
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
      <div className="toast-progress">
        <div className="toast-progress-bar" />
      </div>
    </div>
  );
};

export default ToastNotification;