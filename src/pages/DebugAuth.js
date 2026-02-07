import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const { debugSupabaseConfig, signUp, signIn, requestPasswordReset, resendConfirmationEmail } = useAuth();
  const [debugResult, setDebugResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('TestPassword123!');
  const [testFirstName, setTestFirstName] = useState('Test');
  const [testLastName, setTestLastName] = useState('User');
  const [testPhone, setTestPhone] = useState('0241234567');

  const handleDebug = async () => {
    const result = await debugSupabaseConfig();
    setDebugResult(result);
  };

  const handleTestSignup = async () => {
    if (!testEmail) {
      alert('Please enter test email');
      return;
    }
    
    const result = await signUp(testEmail, testPassword, {
      firstName: testFirstName,
      lastName: testLastName,
      phone: testPhone
    });
    
    console.log('Test Signup Result:', result);
    alert(result.success ? 'Check console for details' : result.error);
  };

  const handleTestSignIn = async () => {
    if (!testEmail) {
      alert('Please enter test email');
      return;
    }
    
    const result = await signIn(testEmail, testPassword);
    console.log('Test SignIn Result:', result);
    alert(result.success ? 'Check console for details' : result.error);
  };

  const handleTestPasswordReset = async () => {
    if (!testEmail) {
      alert('Please enter test email');
      return;
    }
    
    const result = await requestPasswordReset(testEmail);
    console.log('Test Password Reset Result:', result);
    alert(result.success ? 'Check console for details' : result.error);
  };

  const handleTestResendConfirmation = async () => {
    if (!testEmail) {
      alert('Please enter test email');
      return;
    }
    
    const result = await resendConfirmationEmail(testEmail);
    console.log('Test Resend Confirmation Result:', result);
    alert(result.success ? 'Check console for details' : result.error);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Email Debug Tool</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Test Configuration</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Test Email:</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Test Password:</label>
          <input
            type="text"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <button onClick={handleDebug} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Run Debug
        </button>
        <button onClick={handleTestSignup} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Signup
        </button>
        <button onClick={handleTestSignIn} style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Sign In
        </button>
        <button onClick={handleTestPasswordReset} style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
          Test Password Reset
        </button>
        <button onClick={handleTestResendConfirmation} style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Resend Confirmation
        </button>
      </div>

      {debugResult && (
        <div style={{ padding: '20px', backgroundColor: debugResult.success ? '#d4edda' : '#f8d7da', borderRadius: '8px' }}>
          <h3>Debug Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>📋 Troubleshooting Steps:</h3>
        <ol>
          <li><strong>Check Supabase Dashboard → Authentication → Settings</strong>
            <ul>
              <li>Enable "Confirm email"</li>
              <li>Enable "Enable sign-ups"</li>
            </ul>
          </li>
          <li><strong>Check Supabase Dashboard → Email Templates</strong>
            <ul>
              <li>Click "Configure SMTP Provider"</li>
              <li>Use Gmail SMTP settings:</li>
              <li>Host: smtp.gmail.com</li>
              <li>Port: 587</li>
              <li>Username: your-email@gmail.com</li>
              <li>Password: Gmail App Password (not regular password)</li>
            </ul>
          </li>
          <li><strong>Check Supabase Dashboard → Logs → Auth logs</strong>
            <ul>
              <li>Look for "User signup" events</li>
              <li>Check if emails are being sent</li>
              <li>Look for any error messages</li>
            </ul>
          </li>
          <li><strong>Check Your Email</strong>
            <ul>
              <li>Check spam folder</li>
              <li>Wait 1-2 minutes (emails can be delayed)</li>
            </ul>
          </li>
          <li><strong>Common Issues:</strong>
            <ul>
              <li>Gmail blocks "less secure apps" - use App Password</li>
              <li>SMTP credentials incorrect</li>
              <li>Email confirmation disabled in Supabase</li>
              <li>Rate limiting - wait before trying again</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default DebugAuth;