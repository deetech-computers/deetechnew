// test-supabase-signup.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ktxwoqbccmdlaumlydpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eHdvcWJjY21kbGF1bWx5ZHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzE5ODUsImV4cCI6MjA3NDk0Nzk4NX0.ty93Cb19-I7QQBmbJL-oXbxhWPAyCmDzbmnbg-TQa4Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const testEmail = `test-${Date.now()}@example.com`;
  console.log(`Testing signup for: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123456',
      options: {
        emailRedirectTo: 'http://172.20.10.2:3000/auth/callback'
      }
    });

    if (error) {
      console.log('❌ Error:', error.message);
      
      if (error.message.includes('Email service not configured')) {
        console.log('\n🔥 PROBLEM: Supabase SMTP not configured!');
        console.log('Go to: Authentication → Email Templates → Configure SMTP');
        console.log('Use these settings:');
        console.log('- Host: smtp.gmail.com');
        console.log('- Port: 587');
        console.log('- User: cartadaniel01@gmail.com');
        console.log('- Password: kpypczqlayhexmf');
        console.log('- Sender: DEETECH COMPUTERS <cartadaniel01@gmail.com>');
        console.log('- Security: STARTTLS');
      }
    } else {
      console.log('✅ Success!');
      console.log('User ID:', data.user?.id);
      console.log('Session:', data.session ? 'Yes' : 'No (email confirmation needed)');
      console.log('Email sent to:', testEmail);
    }
  } catch (err) {
    console.log('💥 Exception:', err.message);
  }
}

testSignup();