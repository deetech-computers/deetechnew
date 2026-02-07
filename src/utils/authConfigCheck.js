// utils/authConfigCheck.js
export const checkAuthConfig = () => {
  const issues = [];
  
  // Check environment variables
  if (!process.env.REACT_APP_SUPABASE_URL) {
    issues.push('REACT_APP_SUPABASE_URL is not set');
  }
  
  if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
    issues.push('REACT_APP_SUPABASE_ANON_KEY is not set');
  }
  
  // Check redirect URL
  try {
    const redirectUrl = `${window.location.origin}/account`;
    new URL(redirectUrl);
  } catch (error) {
    issues.push(`Invalid redirect URL: ${error.message}`);
  }
  
  // Check if we're on HTTPS in production
  if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
    issues.push('Production environment should use HTTPS');
  }
  
  if (issues.length > 0) {
    console.warn('Auth configuration issues detected:', issues);
    return { ok: false, issues };
  }
  
  return { ok: true };
};

// Call this when your app starts
// useEffect(() => {
//   checkAuthConfig();
// }, []);