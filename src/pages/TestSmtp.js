import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestSmtp = () => {
  const { testSmtpConfiguration } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testResult = await testSmtpConfiguration();
      setResult(testResult);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase SMTP Configuration Test</h1>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '8px',
        border: '2px solid #f59e0b'
      }}>
        <h2 style={{ color: '#92400e' }}>⚠️ Critical: Configure SMTP First!</h2>
        <p>Before testing, you MUST configure SMTP in Supabase Dashboard:</p>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Go to: <a href="https://app.supabase.com/project/ktxwoqbccmdlaumlydpp/auth/templates" target="_blank" rel="noopener noreferrer">Supabase Email Templates</a></li>
          <li>Click "Configure SMTP Provider"</li>
          <li>Use these EXACT settings:
            <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
              <li><strong>Host:</strong> smtp.gmail.com</li>
              <li><strong>Port:</strong> 587</li>
              <li><strong>Username:</strong> cartadaniel01@gmail.com</li>
              <li><strong>Password:</strong> Use Gmail App Password (16 characters)</li>
              <li><strong>Sender Name:</strong> Deetech Computers</li>
              <li><strong>Sender Email:</strong> deetechcomputers01@gmail.com</li>
            </ul>
          </li>
        </ol>
      </div>
      
      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing SMTP Configuration...' : 'Test SMTP Configuration'}
      </button>
      
      {result && (
        <div style={{
          padding: '20px',
          backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
          borderRadius: '8px',
          border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
          marginBottom: '20px'
        }}>
          <h3>Test Result:</h3>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '15px',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#eff6ff', 
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <h3>📋 How to Get Gmail App Password:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Go to: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Google Account Security</a></li>
          <li>Enable <strong>2-Step Verification</strong> (if not already enabled)</li>
          <li>Go to <strong>App passwords</strong> section</li>
          <li>Select:
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>App:</strong> Mail</li>
              <li><strong>Device:</strong> Other (name it "Supabase")</li>
            </ul>
          </li>
          <li>Click "Generate"</li>
          <li>Copy the <strong>16-character password</strong> (looks like: xxxx xxxx xxxx xxxx)</li>
          <li>Use this password in Supabase SMTP configuration (without spaces)</li>
        </ol>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>⚠️ Important:</strong> Do NOT use your regular Gmail password. 
            You MUST use the App Password generated above.
          </p>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
        <h4>🎯 Quick Test in Browser Console:</h4>
        <p>Open browser console (F12) and run:</p>
        <pre style={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '10px',
          borderRadius: '4px',
          overflowX: 'auto',
          fontSize: '14px'
        }}>
{`// Test Supabase Email
const testEmail = 'test-' + Date.now() + '@test.com';

fetch('https://ktxwoqbccmdlaumlydpp.supabase.co/auth/v1/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'sb_publishable_KOwTCa6jCAPBNx2de1fSxg_FePtcGCm'
  },
  body: JSON.stringify({
    email: testEmail,
    password: 'TestPassword123!'
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));`}
        </pre>
      </div>
    </div>
  );
};

export default TestSmtp;