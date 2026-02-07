// src/components/TestSMTP.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const TestSMTP = () => {
  const { 
    resendVerificationEmail, 
    resetPassword, 
    signUp,
    user 
  } = useAuth();

  const [testEmail, setTestEmail] = useState('your-email@gmail.com'); // Change to your actual email
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');

  const addResult = (type, success, message, details = '') => {
    setResults(prev => [
      {
        id: Date.now(),
        type,
        success,
        message,
        details,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  const testSupabaseConfiguration = async () => {
    setDebugInfo('Testing Supabase configuration...');
    
    try {
      // Test 1: Check if we can access auth settings
      const { data: settings, error: settingsError } = await supabase
        .from('auth.config')
        .select('*')
        .limit(1);

      if (settingsError) {
        setDebugInfo(prev => prev + '\n❌ Cannot access auth config: ' + settingsError.message);
      } else {
        setDebugInfo(prev => prev + '\n✅ Can access auth configuration');
      }

      // Test 2: Check current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setDebugInfo(prev => prev + `\n✅ User session: ${session.user.email}`);
      } else {
        setDebugInfo(prev => prev + '\n❌ No user session');
      }

    } catch (error) {
      setDebugInfo(prev => prev + '\n❌ Configuration test failed: ' + error.message);
    }
  };

  const testVerificationEmail = async () => {
    setLoading(true);
    setDebugInfo('Starting verification email test...');
    
    try {
      console.log('Sending verification email to:', testEmail);
      
      const { error } = await resendVerificationEmail(testEmail);
      
      if (error) {
        console.error('Verification email error:', error);
        addResult(
          'Verification Email', 
          false, 
          `Failed: ${error.message}`,
          `Error details: ${JSON.stringify(error, null, 2)}`
        );
        setDebugInfo(prev => prev + `\n❌ Verification failed: ${error.message}`);
      } else {
        console.log('Verification email sent successfully');
        addResult(
          'Verification Email', 
          true, 
          '✅ Verification email sent successfully!',
          'Check your email inbox and spam folder. Also check Supabase logs.'
        );
        setDebugInfo(prev => prev + '\n✅ Verification email API call successful');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      addResult(
        'Verification Email', 
        false, 
        `Unexpected error: ${err.message}`,
        `Stack: ${err.stack}`
      );
      setDebugInfo(prev => prev + `\n❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPasswordReset = async () => {
    setLoading(true);
    setDebugInfo('Starting password reset test...');
    
    try {
      console.log('Sending password reset to:', testEmail);
      
      const { error } = await resetPassword(testEmail);
      
      if (error) {
        console.error('Password reset error:', error);
        addResult(
          'Password Reset', 
          false, 
          `Failed: ${error.message}`,
          `Error details: ${JSON.stringify(error, null, 2)}`
        );
        setDebugInfo(prev => prev + `\n❌ Password reset failed: ${error.message}`);
      } else {
        console.log('Password reset email sent successfully');
        addResult(
          'Password Reset', 
          true, 
          '✅ Password reset email sent successfully!',
          'Check your email inbox and spam folder.'
        );
        setDebugInfo(prev => prev + '\n✅ Password reset API call successful');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      addResult(
        'Password Reset', 
        false, 
        `Unexpected error: ${err.message}`,
        `Stack: ${err.stack}`
      );
      setDebugInfo(prev => prev + `\n❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserSignup = async () => {
    setLoading(true);
    const testUserEmail = `test-${Date.now()}@example.com`;
    setDebugInfo(`Starting user signup test with email: ${testUserEmail}`);
    
    try {
      console.log('Creating test user:', testUserEmail);
      
      const { data, error } = await signUp(
        testUserEmail, 
        'testpassword123', 
        {
          firstName: 'Test',
          lastName: 'User',
          phone: '0241234567'
        }
      );

      if (error) {
        console.error('Signup error:', error);
        addResult(
          'User Signup', 
          false, 
          `Failed: ${error.message}`,
          `Error details: ${JSON.stringify(error, null, 2)}`
        );
        setDebugInfo(prev => prev + `\n❌ Signup failed: ${error.message}`);
      } else {
        console.log('Signup successful:', data);
        addResult(
          'User Signup', 
          true, 
          `✅ Test user created: ${testUserEmail}`,
          `User ID: ${data.user?.id}, Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`
        );
        setDebugInfo(prev => prev + `\n✅ Signup successful, user ID: ${data.user?.id}`);
        
        // If signup was successful, check if we need to send verification
        if (data.user && !data.user.email_confirmed_at) {
          setDebugInfo(prev => prev + '\n📧 Verification email should have been sent automatically');
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      addResult(
        'User Signup', 
        false, 
        `Unexpected error: ${err.message}`,
        `Stack: ${err.stack}`
      );
      setDebugInfo(prev => prev + `\n❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectSupabaseAuth = async () => {
    setLoading(true);
    setDebugInfo('Testing direct Supabase auth call...');
    
    try {
      const testEmail = `direct-test-${Date.now()}@example.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            firstName: 'Direct',
            lastName: 'Test',
            phone: '0241234567'
          },
          emailRedirectTo: `${window.location.origin}/account`
        }
      });

      if (error) {
        addResult(
          'Direct Auth Signup',
          false,
          `Failed: ${error.message}`,
          `Error: ${JSON.stringify(error, null, 2)}`
        );
        setDebugInfo(prev => prev + `\n❌ Direct auth failed: ${error.message}`);
      } else {
        addResult(
          'Direct Auth Signup',
          true,
          `✅ Direct signup successful: ${testEmail}`,
          `User: ${data.user?.id}, Email sent: ${data.user ? 'Yes' : 'No'}`
        );
        setDebugInfo(prev => prev + `\n✅ Direct auth successful`);
      }
    } catch (err) {
      addResult(
        'Direct Auth Signup',
        false,
        `Error: ${err.message}`
      );
      setDebugInfo(prev => prev + `\n❌ Direct auth error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setDebugInfo('');
  };

  const copyDebugInfo = () => {
    navigator.clipboard.writeText(debugInfo);
    alert('Debug info copied to clipboard!');
  };

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          color: '#333', 
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          🐛 SMTP Debugging Tool
        </h1>
        <p style={{ 
          color: '#666', 
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Debug why emails are not being received
        </p>

        {/* Configuration Info */}
        <div style={{ 
          background: '#e8f4fd', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #b6d7e8'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1a5f8e' }}>Current Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><strong>Sender:</strong> deetechcomputers01@gmail.com</div>
            <div><strong>Host:</strong> smtp.gmail.com</div>
            <div><strong>Port:</strong> 465 (SSL)</div>
            <div><strong>Status:</strong> <span style={{ color: '#22c55e' }}>Configured</span></div>
          </div>
        </div>

        {/* Test Email Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Test Email Address (use a REAL email you can check):
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter a real email address you can check..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e1e5e9',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            ⚠️ Use a real Gmail address you have access to for testing
          </small>
        </div>

        {/* Test Buttons */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '30px'
        }}>
          <button
            onClick={testSupabaseConfiguration}
            style={{
              padding: '15px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔧 Test Configuration
          </button>

          <button
            onClick={testVerificationEmail}
            disabled={loading}
            style={{
              padding: '15px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Sending...' : '📨 Test Verification Email'}
          </button>

          <button
            onClick={testPasswordReset}
            disabled={loading}
            style={{
              padding: '15px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Sending...' : '🔐 Test Password Reset'}
          </button>

          <button
            onClick={testUserSignup}
            disabled={loading}
            style={{
              padding: '15px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Creating...' : '👤 Test User Signup'}
          </button>

          <button
            onClick={testDirectSupabaseAuth}
            disabled={loading}
            style={{
              padding: '15px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Testing...' : '⚡ Direct Auth Test'}
          </button>

          <button
            onClick={clearResults}
            style={{
              padding: '15px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🗑️ Clear Results
          </button>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div style={{ 
            background: '#1f2937', 
            color: '#f3f4f6', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong>Debug Information:</strong>
              <button 
                onClick={copyDebugInfo}
                style={{
                  background: '#4b5563',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 Copy
              </button>
            </div>
            {debugInfo}
          </div>
        )}

        {/* Results */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>Test Results:</h3>
          {results.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              No tests run yet. Click buttons above to debug SMTP issues.
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {results.map((result) => (
                <div
                  key={result.id}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: result.success ? '#f0f9ff' : '#fef2f2',
                    border: `1px solid ${result.success ? '#bae6fd' : '#fecaca'}`,
                    borderRadius: '6px',
                    borderLeft: `4px solid ${result.success ? '#22c55e' : '#ef4444'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <strong style={{ color: result.success ? '#15803d' : '#dc2626' }}>
                      {result.type}
                    </strong>
                    <small style={{ color: '#666' }}>{result.timestamp}</small>
                  </div>
                  <div style={{ color: result.success ? '#15803d' : '#dc2626', marginBottom: '8px' }}>
                    {result.message}
                  </div>
                  {result.details && (
                    <div style={{ 
                      background: 'rgba(0,0,0,0.05)', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {result.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div style={{ 
        background: '#fff9ed', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #fed7aa'
      }}>
        <h3 style={{ color: '#ea580c', marginBottom: '15px' }}>🔍 SMTP Troubleshooting Guide</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#ea580c' }}>Common Issues:</h4>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Gmail App Password not configured</li>
              <li>2-factor authentication not enabled</li>
              <li>Supabase SMTP not properly configured</li>
              <li>Email confirmation disabled in Supabase</li>
              <li>Emails going to spam folder</li>
              <li>Rate limiting by Gmail</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#ea580c' }}>Quick Checks:</h4>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Use a real Gmail address for testing</li>
              <li>Check spam and promotions folders</li>
              <li>Verify Supabase SMTP settings in dashboard</li>
              <li>Check Supabase logs for email attempts</li>
              <li>Wait 5-10 minutes for email delivery</li>
            </ol>
          </div>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', background: '#fef3c7', borderRadius: '4px' }}>
          <strong>Next Steps:</strong> 
          <br/>1. Go to Supabase Dashboard → Authentication → Settings
          <br/>2. Ensure "Enable email confirmations" is ON
          <br/>3. Check SMTP configuration in Project Settings
          <br/>4. Verify Gmail has App Password configured
        </div>
      </div>
    </div>
  );
};

export default TestSMTP;