// scripts/check-environment.js
const fs = require('fs');
require('dotenv').config({ path: '.env.development.local' });

console.log('🔍 Checking environment configuration...');

const requiredVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  console.log('\nPlease add these to your .env.development.local file:');
  missing.forEach(varName => {
    console.log(`${varName}=your_value_here`);
  });
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('\n📊 Configuration:');
console.log(`- Supabase URL: ${process.env.REACT_APP_SUPABASE_URL}`);
console.log(`- Environment: ${process.env.NODE_ENV}`);
console.log(`- Debug mode: ${process.env.REACT_APP_DEBUG || 'false'}`);