// test-final-fix.js
const { createClient } = require('@supabase/supabase-js');

console.log('=== DEETECH FINAL FIX TEST ===\n');

// Use hardcoded values
const supabaseUrl = 'https://ktxwoqbccmdlaumlydpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eHdvcWJjY21kbGF1bWx5ZHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzE5ODUsImV4cCI6MjA3NDk0Nzk4NX0.ty93Cb19-I7QQBmbJL-oXbxhWPAyCmDzbmnbg-TQa4Y';
const emailRedirectUrl = 'http://172.20.10.2:3000/auth/callback';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    redirectTo: emailRedirectUrl
  }
});

async function test() {
  console.log('1. Configuration:');
  console.log('   URL:', supabaseUrl ? '✅' : '❌');
  console.log('   Redirect:', emailRedirectUrl);
  
  console.log('\n2. Testing signup...');
  const testEmail = `final-fix-${Date.now()}@example.com`;
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123456',
      options: {
        emailRedirectTo: emailRedirectUrl
      }
    });

    if (error) {
      console.log('❌ Error:', error.message);
      
      if (error.message.includes('confirmation email')) {
        console.log('\n🔥 SMTP Configuration Check:');
        console.log('Go to Supabase Dashboard → Authentication → Email Templates');
        console.log('Verify SMTP is set to:');
        console.log('   Host: smtp.resend.com');
        console.log('   Port: 465');
        console.log('   User: resend');
        console.log('   Password: re_D5cVt1sJ_Kx3NfKF4YY8xGsgBgpJFQLA4');
        console.log('   Sender: onboarding@resend.dev');
        console.log('   Security: SSL/TLS');
      }
    } else {
      console.log('✅ Success!');
      console.log('Email sent to:', testEmail);
      console.log('User ID:', data.user?.id);
    }
  } catch (err) {
    console.log('💥 Exception:', err.message);
  }
}

test();