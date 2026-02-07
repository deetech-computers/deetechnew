// scripts/setup-local.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up local development environment...');

const envExample = `# Copy this to .env.development.local and fill in your values
REACT_APP_SUPABASE_URL=http://localhost:54321
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
REACT_APP_ADMIN_EMAIL=cartadaniel01@gmail.com
REACT_APP_DEBUG=true
REACT_APP_ALLOW_HTTP=true

# For local HTTPS testing (optional)
REACT_APP_HTTPS=true
REACT_APP_SSL_CRT_FILE=./localhost.crt
REACT_APP_SSL_KEY_FILE=./localhost.key
`;

fs.writeFileSync('.env.example', envExample);
console.log('✅ Created .env.example file');

// Create a simple dev server config
const devServerConfig = `
// craco.config.js (if using Create React App)
module.exports = {
  devServer: {
    allowedHosts: 'all',
    // For HTTPS locally (optional)
    // https: {
    //   key: fs.readFileSync(process.env.REACT_APP_SSL_KEY_FILE),
    //   cert: fs.readFileSync(process.env.REACT_APP_SSL_CRT_FILE),
    // },
    historyApiFallback: true,
    hot: true,
    open: true,
    port: 3000,
  },
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
        }
      }
    }
  }
};
`;

try {
  fs.writeFileSync('craco.config.js', devServerConfig);
  console.log('✅ Created craco.config.js for advanced configuration');
} catch (err) {
  console.log('⚠️ Could not create craco.config.js (not using CRA?)');
}

console.log('\n📝 Next steps:');
console.log('1. Copy .env.example to .env.development.local');
console.log('2. Fill in your Supabase credentials');
console.log('3. Run: npm install');
console.log('4. Run: npm start');
console.log('\n🌐 For HTTPS locally:');
console.log('   - Generate SSL cert: mkcert localhost');
console.log('   - Set REACT_APP_HTTPS=true in .env.development.local');