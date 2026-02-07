// src/components/ErrorBoundary.js
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Generate a unique error ID for tracking
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return { 
      hasError: true,
      error: error,
      errorId: errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('🔴 ErrorBoundary Caught Error:', {
      errorId: this.state.errorId,
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    this.setState({
      errorInfo: errorInfo
    });

    // You could send this to an error tracking service here
    // Example: sendToErrorTrackingService({ errorId, error, errorInfo });
  }

  handleReload = () => {
    // Clear error state and reload
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
    
    // Clear problematic session storage
    sessionStorage.removeItem('lastScrollPosition');
    localStorage.removeItem('errorState');
    
    // Force a hard reload
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
    window.location.href = '/';
  };

  handleTryAgain = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
    
    // If we have a fallback component, just reset state
    if (this.props.fallback) {
      return;
    }
  };

  renderErrorUI() {
    const { errorId } = this.state;
    const { fallback, showDetails = process.env.NODE_ENV === 'development' } = this.props;

    // If a custom fallback is provided, use it
    if (fallback) {
      return typeof fallback === 'function' 
        ? fallback({ 
            error: this.state.error, 
            errorId: errorId,
            onReload: this.handleReload,
            onGoHome: this.handleGoHome 
          })
        : fallback;
    }

    // Default error UI
    return (
      <div className="error-boundary">
        <div className="error-boundary-content">
          <div className="error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p className="error-message">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          
          {errorId && (
            <p className="error-id">
              Error ID: <code>{errorId}</code>
            </p>
          )}
          
          <div className="error-actions">
            <button 
              onClick={this.handleTryAgain}
              className="btn btn-primary"
            >
              Try Again
            </button>
            <button 
              onClick={this.handleGoHome}
              className="btn btn-secondary"
            >
              Go Home
            </button>
            <button 
              onClick={this.handleReload}
              className="btn btn-outline"
            >
              Reload Page
            </button>
          </div>

          {showDetails && this.state.error && (
            <details className="error-details">
              <summary>Error Details (Development Only)</summary>
              <div className="error-details-content">
                <h4>Error Message:</h4>
                <pre className="error-pre">{this.state.error.toString()}</pre>
                
                {this.state.errorInfo && (
                  <>
                    <h4>Component Stack:</h4>
                    <pre className="error-pre">{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
                
                <h4>Additional Info:</h4>
                <ul className="error-info-list">
                  <li><strong>URL:</strong> {window.location.href}</li>
                  <li><strong>Timestamp:</strong> {new Date().toISOString()}</li>
                  <li><strong>Environment:</strong> {process.env.NODE_ENV}</li>
                </ul>
              </div>
            </details>
          )}
          
          <div className="error-help">
            <p>
              If the problem persists, please{' '}
              <a href="/support" className="error-link">contact support</a> 
              {' '}with the Error ID above.
            </p>
          </div>
        </div>
        
        <style jsx>{`
          .error-boundary {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .error-boundary-content {
            background: white;
            border-radius: 12px;
            padding: 2.5rem;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            text-align: center;
          }
          
          .error-icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
          }
          
          h2 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 1.8rem;
          }
          
          .error-message {
            color: #666;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          
          .error-id {
            background: #f8f9fa;
            padding: 0.75rem;
            border-radius: 6px;
            margin: 1.5rem 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            word-break: break-all;
          }
          
          .error-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin: 2rem 0;
            flex-wrap: wrap;
          }
          
          .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-block;
          }
          
          .btn-primary {
            background: #4f46e5;
            color: white;
          }
          
          .btn-primary:hover {
            background: #4338ca;
            transform: translateY(-2px);
          }
          
          .btn-secondary {
            background: #6b7280;
            color: white;
          }
          
          .btn-secondary:hover {
            background: #4b5563;
            transform: translateY(-2px);
          }
          
          .btn-outline {
            background: transparent;
            border: 2px solid #d1d5db;
            color: #374151;
          }
          
          .btn-outline:hover {
            border-color: #9ca3af;
            background: #f9fafb;
          }
          
          .error-details {
            margin: 2rem 0;
            text-align: left;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .error-details summary {
            padding: 1rem;
            background: #f9fafb;
            cursor: pointer;
            font-weight: 600;
            color: #4f46e5;
          }
          
          .error-details-content {
            padding: 1rem;
            background: white;
            border-top: 1px solid #e5e7eb;
          }
          
          .error-pre {
            background: #1f2937;
            color: #f3f4f6;
            padding: 1rem;
            border-radius: 6px;
            overflow: auto;
            font-size: 0.85rem;
            margin: 1rem 0;
            max-height: 300px;
          }
          
          .error-info-list {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
          }
          
          .error-info-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .error-help {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
          }
          
          .error-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 600;
          }
          
          .error-link:hover {
            text-decoration: underline;
          }
          
          @media (max-width: 640px) {
            .error-boundary {
              padding: 1rem;
            }
            
            .error-boundary-content {
              padding: 1.5rem;
            }
            
            .error-actions {
              flex-direction: column;
            }
            
            .btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development'
};

export default ErrorBoundary;