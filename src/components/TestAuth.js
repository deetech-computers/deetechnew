// TestAuth.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const TestAuth = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(`test${Date.now()}@example.com`);
  const [password, setPassword] = useState('Test123456!');
  const [testType, setTestType] = useState('supabase'); // 'supabase' or 'elastic'

  const testSupabaseSMTP = async () => {
    console.log('🔍 Testing Supabase SMTP Configuration...');
    
    try {
      // Test 1: Check Supabase health
      const healthResponse = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/auth/v1/health`);
      console.log('Supabase Health:', await healthResponse.json());
      
      // Test 2: Try signup with different configurations
      const tests = [
        {
          name: 'Without emailRedirectTo',
          config: {
            email: `test1${Date.now()}@example.com`,
            password: 'Test123456!',
            options: { data: { test: 'no-redirect' } }
          }
        },
        {
          name: 'With emailRedirectTo',
          config: {
            email: `test2${Date.now()}@example.com`,
            password: 'Test123456!',
            options: {
              emailRedirectTo: `${window.location.origin}/verify-success`,
              data: { test: 'with-redirect' }
            }
          }
        },
        {
          name: 'Magic Link (OTP)',
          config: {
            email: `test3${Date.now()}@example.com`,
            options: {
              emailRedirectTo: `${window.location.origin}/verify-success`
            }
          }
        }
      ];
      
      const testResults = [];
      
      for (const test of tests) {
        try {
          console.log(`\nRunning test: ${test.name}`);
          
          let result;
          if (test.name === 'Magic Link (OTP)') {
            result = await supabase.auth.signInWithOtp(test.config);
          } else {
            result = await supabase.auth.signUp(test.config);
          }
          
          testResults.push({
            test: test.name,
            success: !result.error,
            error: result.error?.message,
            data: result.data
          });
          
          console.log(`${test.name}:`, result.error ? `❌ ${result.error.message}` : '✅ Success');
          
        } catch (testError) {
          testResults.push({
            test: test.name,
            success: false,
            error: testError.message
          });
          console.log(`${test.name}: ❌ ${testError.message}`);
        }
      }
      
      return testResults;
      
    } catch (error) {
      console.error('Supabase SMTP test failed:', error);
      throw error;
    }
  };

  const testElasticEmail = async () => {
    console.log('🔍 Testing Elastic Email Configuration...');
    
    try {
      // Test Elastic Email API directly
      const formData = new URLSearchParams();
      formData.append('apikey', process.env.REACT_APP_ELASTIC_EMAIL_API_KEY);
      formData.append('from', process.env.REACT_APP_ELASTIC_FROM_EMAIL);
      formData.append('fromName', process.env.REACT_APP_ELASTIC_FROM_NAME);
      formData.append('to', 'cartadaniel01@gmail.com');
      formData.append('subject', 'Test from Elastic Email');
      formData.append('bodyHtml', '<h1>Test Email</h1><p>This is a test from React app</p>');
      formData.append('isTransactional', 'true');
      
      const response = await fetch('https://api.elasticemail.com/v2/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const result = await response.json();
      console.log('Elastic Email API Response:', result);
      
      if (result.success) {
        return { success: true, messageId: result.data?.messageid };
      } else {
        throw new Error(result.error || 'Elastic Email failed');
      }
      
    } catch (error) {
      console.error('Elastic Email test failed:', error);
      throw error;
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setResults({});
    
    try {
      console.log('=== Starting Comprehensive Auth Test ===');
      console.log('Test Type:', testType);
      console.log('Test Email:', email);
      console.log('Test Password:', password);
      
      let testResult;
      
      if (testType === 'supabase') {
        testResult = await testSupabaseSMTP();
      } else {
        testResult = await testElasticEmail();
      }
      
      setResults({
        success: Array.isArray(testResult) 
          ? testResult.some(r => r.success)
          : testResult.success,
        data: testResult,
        testType
      });
      
    } catch (error) {
      console.error('Test failed with exception:', error);
      setResults({
        success: false,
        error: {
          message: error.message,
          stack: error.stack
        },
        testType
      });
    } finally {
      setLoading(false);
    }
  };

  const testManualSignup = async () => {
    setLoading(true);
    
    try {
      console.log('🛠️ Testing manual signup without Supabase client...');
      
      // Direct API call to Supabase
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/auth/v1/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email: `manual${Date.now()}@example.com`,
            password: 'Test123456!',
            data: { test: 'manual' }
          })
        }
      );
      
      const data = await response.json();
      console.log('Manual API Response:', data);
      
      setResults({
        success: !data.error,
        data,
        error: data.error,
        testType: 'manual-api'
      });
      
    } catch (error) {
      console.error('Manual test failed:', error);
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    console.log('Local storage cleared');
    setResults({});
  };

  const checkSupabaseConfig = async () => {
    console.log('🔧 Checking Supabase Configuration...');
    
    const checks = [
      { name: 'Supabase URL', value: process.env.REACT_APP_SUPABASE_URL },
      { name: 'Anon Key', value: process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...' },
      { name: 'Base URL', value: process.env.REACT_APP_BASE_URL },
      { name: 'Window Origin', value: window.location.origin },
      { name: 'Redirect URL', value: `${window.location.origin}/verify-success` }
    ];
    
    console.table(checks);
    
    // Check if redirect URL matches
    const siteUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
    const redirectUrl = `${siteUrl}/verify-success`;
    
    console.log('📌 Expected redirect URL:', redirectUrl);
    console.log('📌 Current window origin:', window.location.origin);
    
    if (siteUrl !== window.location.origin) {
      console.warn('⚠️ Site URL does not match window origin!');
      console.warn(`Site URL: ${siteUrl}`);
      console.warn(`Window origin: ${window.location.origin}`);
    }
  };

  useEffect(() => {
    console.log('=== Initial Environment Check ===');
    console.log('Current URL:', window.location.href);
    console.log('Is HTTPS:', window.location.protocol === 'https:');
    console.log('LocalStorage has supabase token:', !!localStorage.getItem('supabase.auth.token'));
    
    checkSupabaseConfig();
  }, []);

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🔧 Email & Auth Debug Tool</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>Test Configuration</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Test Type:</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => setTestType('supabase')}
              style={{
                padding: '8px 16px',
                backgroundColor: testType === 'supabase' ? '#007bff' : '#f8f9fa',
                color: testType === 'supabase' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Test Supabase SMTP
            </button>
            <button
              onClick={() => setTestType('elastic')}
              style={{
                padding: '8px 16px',
                backgroundColor: testType === 'elastic' ? '#007bff' : '#f8f9fa',
                color: testType === 'elastic' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Test Elastic Email
            </button>
          </div>
        </div>
        
        {testType === 'supabase' && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Test Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Test Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </>
        )}
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={testSignup}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : `Test ${testType === 'supabase' ? 'Supabase Signup' : 'Elastic Email'}`}
          </button>
          
          {testType === 'supabase' && (
            <button
              onClick={testManualSignup}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Manual API Test
            </button>
          )}
          
          <button
            onClick={clearLocalStorage}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Storage
          </button>
          
          <button
            onClick={checkSupabaseConfig}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Check Config
          </button>
        </div>
      </div>
      
      {loading && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          ⏳ Running tests... Check browser console for details
        </div>
      )}
      
      {results.success !== undefined && (
        <div style={{ 
          backgroundColor: results.success ? '#d4edda' : '#f8d7da',
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${results.success ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <h3 style={{ 
            color: results.success ? '#155724' : '#721c24',
            marginTop: 0
          }}>
            {results.success ? '✅ Test Successful' : '❌ Test Failed'}
          </h3>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Test Type:</strong> {results.testType}
          </div>
          
          {results.error && (
            <div>
              <h4>Error Details:</h4>
              <div style={{ 
                backgroundColor: 'rgba(220,53,69,0.1)',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px',
                overflowX: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {typeof results.error === 'object' 
                    ? JSON.stringify(results.error, null, 2)
                    : results.error}
                </pre>
              </div>
            </div>
          )}
          
          {results.data && (
            <div>
              <h4>Response Data:</h4>
              <pre style={{ 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                padding: '10px',
                borderRadius: '4px',
                overflowX: 'auto',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🔍 Quick Diagnostics</h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginTop: '15px'
        }}>
          <div style={{ 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h4 style={{ marginTop: 0 }}>Supabase URL</h4>
            <code style={{ 
              display: 'block',
              padding: '5px',
              backgroundColor: '#f8f9fa',
              borderRadius: '3px',
              wordBreak: 'break-all',
              fontSize: '12px'
            }}>
              {process.env.REACT_APP_SUPABASE_URL}
            </code>
          </div>
          
          <div style={{ 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h4 style={{ marginTop: 0 }}>Elastic Email API Key</h4>
            <code style={{ 
              display: 'block',
              padding: '5px',
              backgroundColor: '#f8f9fa',
              borderRadius: '3px',
              wordBreak: 'break-all',
              fontSize: '12px'
            }}>
              {process.env.REACT_APP_ELASTIC_EMAIL_API_KEY?.substring(0, 20) + '...'}
            </code>
          </div>
          
          <div style={{ 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h4 style={{ marginTop: 0 }}>Site Configuration</h4>
            <div style={{ fontSize: '12px' }}>
              <div><strong>Site URL:</strong> {process.env.REACT_APP_BASE_URL}</div>
              <div><strong>Current Origin:</strong> {window.location.origin}</div>
              <div><strong>Match:</strong> {process.env.REACT_APP_BASE_URL === window.location.origin ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '15px', 
        borderRadius: '4px',
        borderLeft: '4px solid #007bff'
      }}>
        <h4 style={{ marginTop: 0 }}>📝 Instructions:</h4>
        <ol style={{ marginBottom: 0 }}>
          <li><strong>Test Supabase SMTP:</strong> Click "Test Supabase Signup" to see if Supabase can send emails</li>
          <li><strong>Test Elastic Email:</strong> Switch to "Test Elastic Email" to test your Elastic Email API key</li>
          <li><strong>Manual API Test:</strong> Use "Manual API Test" to bypass the Supabase client</li>
          <li><strong>Check browser console</strong> (F12 → Console) for detailed logs</li>
          <li><strong>Check Network tab</strong> for failed requests and view response details</li>
        </ol>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '4px',
        borderLeft: '4px solid #ffc107'
      }}>
        <h4 style={{ marginTop: 0, color: '#856404' }}>⚠️ Common Issues & Fixes:</h4>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>"Error sending confirmation email":</strong> Supabase SMTP not configured or invalid</li>
          <li><strong>Status 500:</strong> Server error - check Supabase dashboard SMTP settings</li>
          <li><strong>Redirect URL mismatch:</strong> Ensure Site URL in Supabase matches your app URL</li>
          <li><strong>Elastic Email fails:</strong> Verify API key and account status</li>
        </ul>
      </div>
    </div>
  );
};

export default TestAuth;