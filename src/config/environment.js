// config/environment.js

export const getEnvironmentConfig = () => {
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      window.location.hostname.startsWith('192.168.');
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Force HTTPS in production, allow HTTP in local development
  const protocol = isProduction ? 'https://' : window.location.protocol + '//';
  
  // Use window.location for dynamic URL generation
  const currentOrigin = window.location.origin;
  const baseUrl = isLocalhost ? currentOrigin : 
                  isProduction ? 'https://your-domain.com' : currentOrigin;
  
  return {
    isLocalhost,
    isDevelopment,
    isProduction,
    protocol,
    baseUrl,
    // URL helpers for different environments
    getRedirectUrl: (path = '') => {
      const base = isProduction ? 'https://your-domain.com' : currentOrigin;
      return `${base}${path}`;
    },
    getApiUrl: () => {
      // For local development with custom ports
      if (isLocalhost && window.location.port) {
        return `${protocol}localhost:${window.location.port}`;
      }
      return baseUrl;
    }
  };
};

export const ENV = getEnvironmentConfig();