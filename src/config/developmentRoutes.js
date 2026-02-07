import React from 'react';
import { lazy } from 'react';

// Development-only components
const TestSMTP = lazy(() => import('../components/TestSMTP'));

export const developmentRoutes = [
  {
    path: '/test-smtp',
    element: <TestSMTP />
  }
];

export const isDevelopment = process.env.NODE_ENV === 'development';