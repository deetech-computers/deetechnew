// verify-supabase-config.js
console.log('=== DEETECH SUPABASE CONFIG VERIFICATION ===\n');

console.log('1. Check if .env variables are loaded in React:');
console.log('   REACT_APP_SITE_URL:', process.env.REACT_APP_SITE_URL || '❌ Missing');
console.log('   REACT_APP_EMAIL_REDIRECT_URL:', process.env.REACT_APP_EMAIL_REDIRECT_URL || '❌ Missing');

console.log('\n2. Test Supabase connection:');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ktxwoqbccmdlaumlydpp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eHdvcWJjY21kbGF1bWx5ZHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzE5ODUsImV4cCI6MjA3NDk0Nzk4NX0.ty93Cb19-I7QQBmbJL-oXbxhWPAyCmDzbmnbg-TQa4Y'
);

async function test() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('❌ Supabase connection error:', error.message);
  } else {
    console.log('✅ Supabase connected successfully');
  }
  
  // Test signup
  const testEmail = `verify-${Date.now()}@example.com`;
  console.log('\n3. Testing signup with:', testEmail);
  
  const signupResult = await supabase.auth.signUp({
    email: testEmail,
    password: 'Test123456',
    options: {
      emailRedirectTo: 'http://172.20.10.2:3000/auth/callback'
    }
  });
  
  if (signupResult.error) {
    console.log('❌ Signup error:', signupResult.error.message);
  } else {
    console.log('✅ Signup successful!');
    console.log('User ID:', signupResult.data.user?.id);
  }
}

test();