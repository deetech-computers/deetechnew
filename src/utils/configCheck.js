// src/utils/configCheck.js
export const checkEnvironment = () => {
  const config = {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
    baseUrl: process.env.REACT_APP_BASE_URL,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'server',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  };
  
  console.group('🔧 Environment Configuration');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_BASE_URL:', config.baseUrl);
  console.log('REACT_APP_SUPABASE_URL:', config.supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('Current Origin:', config.currentOrigin);
  console.log('Protocol:', config.protocol);
  console.groupEnd();
  
  // Warn about HTTPS in production
  if (config.isProduction && config.protocol !== 'https:') {
    console.warn('⚠️ Production site should use HTTPS!');
  }
  
  return config;
};

// Use this in your App.js or index.js
// useEffect(() => {
//   checkEnvironment();
// }, []);