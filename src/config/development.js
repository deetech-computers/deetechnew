// config/development.js
export const isDevelopment = process.env.NODE_ENV === 'development';

export const developmentConfig = {
  // Disable strict OAuth checks in development
  oauth: {
    allowHttpRedirects: true,
    skipSecureCookieCheck: true
  },
  // Add local storage prefix to avoid conflicts
  storagePrefix: 'dev_'
};