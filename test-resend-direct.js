// test-resend-direct.js
const { Resend } = require('resend');

const resend = new Resend('re_D5cVt1sJ_Kx3NfKF4YY8xGsgBgpJFQLA4');

async function testResend() {
  console.log('Testing DEETECH Resend service...\n');
  
  try {
    const data = await resend.emails.send({
      from: 'DEETECH COMPUTERS <onboarding@resend.dev>',
      to: ['deetechcomputers01@gmail.com'],
      subject: 'DEETECH Resend Test',
      html: '<strong>✅ DEETECH Resend is working!</strong>',
    });
    
    console.log('✅ Resend test successful!');
    console.log('Email ID:', data.id);
    console.log('Check your inbox at deetechcomputers01@gmail.com');
  } catch (error) {
    console.error('❌ Resend error:', error.message);
    
    if (error.message.includes('domain')) {
      console.log('\nNote: Using Resend test domain. For production:');
      console.log('1. Verify your domain in Resend dashboard');
      console.log('2. Or use: cartadaniel01@gmail.com as sender');
    }
  }
}

testResend();