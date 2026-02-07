// src/components/EnvCheck.jsx
import React, { useEffect } from 'react';

const EnvCheck = () => {
  useEffect(() => {
    console.log('=== REACT APP ENVIRONMENT CHECK ===');
    console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('REACT_APP_SITE_URL:', process.env.REACT_APP_SITE_URL);
    console.log('REACT_APP_EMAIL_REDIRECT_URL:', process.env.REACT_APP_EMAIL_REDIRECT_URL);
    console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('REACT_APP')));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Environment Variables in React</h2>
      <pre>
        REACT_APP_SUPABASE_URL: {process.env.REACT_APP_SUPABASE_URL || 'Not found'}
        REACT_APP_EMAIL_REDIRECT_URL: {process.env.REACT_APP_EMAIL_REDIRECT_URL || 'Not found'}
        REACT_APP_SITE_URL: {process.env.REACT_APP_SITE_URL || 'Not found'}
      </pre>
    </div>
  );
};

export default EnvCheck;