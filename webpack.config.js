module.exports = {
  // ... your existing config
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000,
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/System Volume Information/**',
      'C:\\System Volume Information'
    ]
  }
};