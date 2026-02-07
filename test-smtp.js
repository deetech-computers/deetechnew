// test-smtp-simple.js
// Simple test without external dependencies
console.log('Testing Gmail SMTP configuration...\n');

// Test using built-in fetch
async function testGmail() {
  console.log('1. Check if app password works...');
  
  // You can't directly test SMTP without nodemailer
  // But we can check if the password format is correct
  const password = 'nolimlnilcwydwmu';
  
  if (!password || password.length !== 16) {
    console.log('❌ Password should be 16 characters (no spaces)');
    console.log('Current length:', password.length);
    console.log('Regenerate at: https://myaccount.google.com/apppasswords');
    return;
  }
  
  console.log('✅ Password format looks correct (16 characters)');
  
  console.log('\n2. Testing Supabase signup with current config...');
  
  // Use the same test as before
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://ktxwoqbccmdlaumlydpp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eHdvcWJjY21kbGF1bWx5ZHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzE5ODUsImV4cCI6MjA3NDk0Nzk4NX0.ty93Cb19-I7QQBmbJL-oXbxhWPAyCmDzbmnbg-TQa4Y'
  );
  
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123456',
      options: {
        emailRedirectTo: 'http://172.20.10.2:3000/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Signup error:', error.message);
      
      if (error.message.includes('confirmation email')) {
        console.log('\n🔥 SOLUTION: SMTP not configured in Supabase');
        console.log('\nRun this SQL in Supabase SQL Editor:');
        console.log(`
-- Fix SMTP Configuration
INSERT INTO auth.smtp (host, port, user, pass, sender_name, sender_email, security)
VALUES (
  'smtp.gmail.com',
  587,
  'cartadaniel01@gmail.com',
  'nolimlnilcwydwmu',
  'DEETECH COMPUTERS',
  'cartadaniel01@gmail.com',
  'starttls'
);
        `);
      }
    } else {
      console.log('✅ Success! Email should be sent to:', testEmail);
    }
  } catch (err) {
    console.log('💥 Exception:', err.message);
  }
}

testGmail();