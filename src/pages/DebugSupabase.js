import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugSupabase = () => {
  const { testSupabaseEmail } = useAuth();
  const [testEmail, setTestEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testResult = await testSupabaseEmail(testEmail || undefined);
      setResult(testResult);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Email Debug Tool</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2>Test Email Configuration</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Test Email (optional):</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com (leave empty for auto-generated)"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>
            Leave empty to generate a test email like test-123456789@test.com
          </small>
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
            fontSize: '16px'
          }}
        >
          {loading ? 'Testing...' : 'Run Supabase Email Test'}
        </button>
      </div>
      
      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
          borderRadius: '8px',
          border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`
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
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
        <h3>📋 Steps to Check in Supabase Dashboard:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>
            <strong>Go to Supabase Dashboard:</strong><br/>
            <a href="https://app.supabase.com/project/ktxwoqbccmdlaumlydpp" target="_blank" rel="noopener noreferrer">
              https://app.supabase.com/project/ktxwoqbccmdlaumlydpp
            </a>
          </li>
          <li>
            <strong>Check Authentication Settings:</strong>
            <ul>
              <li>Click "Authentication" → "Settings"</li>
              <li>Enable "Confirm email" (MUST BE ON)</li>
              <li>Enable "Enable sign-ups"</li>
            </ul>
          </li>
          <li>
            <strong>Configure SMTP:</strong>
            <ul>
              <li>Click "Email Templates"</li>
              <li>Click "Configure SMTP Provider"</li>
              <li>Fill in Gmail SMTP settings:</li>
              <li>Host: smtp.gmail.com</li>
              <li>Port: 587</li>
              <li>Username: cartadaniel01@gmail.com</li>
              <li>Password: Use Gmail App Password (not regular password)</li>
              <li>Sender Name: Deetech Computers</li>
              <li>Sender Email: deetechcomputers01@gmail.com</li>
            </ul>
          </li>
          <li>
            <strong>Check Logs:</strong>
            <ul>
              <li>Click "Logs" → "Auth logs"</li>
              <li>Look for "User signup" events after running test</li>
              <li>Check if emails show as "sent"</li>
            </ul>
          </li>
          <li>
            <strong>Check Database:</strong>
            <ul>
              <li>Click "Table Editor"</li>
              <li>Find the "auth.users" table</li>
              <li>Check if test user was created</li>
              <li>Check email_confirmed_at column</li>
            </ul>
          </li>
        </ol>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>⚠️ Common Issues:</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            <strong>SMTP not configured:</strong> You MUST configure SMTP in Supabase Dashboard
          </li>
          <li>
            <strong>Gmail blocking:</strong> Use Gmail App Password, not regular password
          </li>
          <li>
            <strong>Email confirmation disabled:</strong> Enable "Confirm email" in settings
          </li>
          <li>
            <strong>Emails in spam:</strong> Check spam folder, mark as "Not spam"
          </li>
          <li>
            <strong>Rate limiting:</strong> Wait 1-2 minutes between tests
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DebugSupabase;