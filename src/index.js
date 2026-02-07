import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Reduce noisy logs in production (keep real errors visible)
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};

  const originalError = console.error;
  console.error = (...args) => {
    const msg = args?.[0]?.message || args?.[0];
    if (typeof msg === 'string') {
      if (
        msg.includes('Clipboard not available') ||
        msg.includes('Products clipboard not available')
      ) {
        return;
      }
    }
    originalError(...args);
  };
}

// Create root (modern React 18+ method)
const container = document.getElementById('root');
const root = createRoot(container);

// Render app inside StrictMode (helps detect side effects)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
