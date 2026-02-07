// components/DarkModeToggle.js
import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="dark-mode-toggle"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '20px',
        background: isDarkMode ? '#333' : '#fff',
        color: isDarkMode ? '#fff' : '#333',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
      <span style={{ fontSize: '14px', fontWeight: '500' }}>
        {isDarkMode ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default DarkModeToggle;