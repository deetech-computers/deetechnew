// utils/enhancedLazyLoading.js
import { lazy } from 'react';

// Enhanced lazy loading with chunk error handling and retry mechanism
const lazyWithRetry = (componentImport, maxRetries = 3) => {
  return lazy(async () => {
    const container = {
      status: 'pending',
      promise: null,
      result: null,
      error: null,
      retries: 0
    };

    const load = async () => {
      try {
        container.status = 'loading';
        const component = await componentImport();
        container.status = 'success';
        container.result = component;
        return component;
      } catch (error) {
        container.retries++;
        container.error = error;

        if (container.retries <= maxRetries) {
          console.warn(`Chunk load failed, retrying (${container.retries}/${maxRetries})...`);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, 1000 * Math.pow(2, container.retries - 1))
          );
          return load();
        } else {
          container.status = 'error';
          throw error;
        }
      }
    };

    container.promise = load();
    return container.promise;
  });
};

// Preload chunks for better performance
const preloadChunk = (componentImport) => {
  if (typeof window !== 'undefined') {
    componentImport().catch(() => {
      // Silent fail for preload
    });
  }
};

// Enhanced lazy components with retry mechanism
export const Home = lazyWithRetry(() => import('../pages/Home'));
export const Products = lazyWithRetry(() => import('../pages/Products'));
export const ProductDetail = lazyWithRetry(() => import('../pages/ProductDetail'));
export const Cart = lazyWithRetry(() => import('../pages/Cart'));
export const Checkout = lazyWithRetry(() => import('../pages/Checkout'));
export const ThankYou = lazyWithRetry(() => import('../pages/ThankYou'));
export const Account = lazyWithRetry(() => import('../pages/Account'));
export const Login = lazyWithRetry(() => import('../pages/Login'));
export const Admin = lazyWithRetry(() => import('../pages/Admin'));
export const Affiliates = lazyWithRetry(() => import('../pages/Affiliates'));
export const AffiliateDashboard = lazyWithRetry(() => import('../pages/AffiliateDashboard'));
export const Warranty = lazyWithRetry(() => import('../pages/Warranty'));
export const PaymentPolicy = lazyWithRetry(() => import('../pages/PaymentPolicy'));
export const About = lazyWithRetry(() => import('../pages/About'));
export const DeliveryPolicy = lazyWithRetry(() => import('../pages/DeliveryPolicy'));
export const ReturnRefundPolicy = lazyWithRetry(() => import('../pages/ReturnRefundPolicy'));
export const PrivacyPolicy = lazyWithRetry(() => import('../pages/PrivacyPolicy'));
export const TermsOfUse = lazyWithRetry(() => import('../pages/TermsOfUse'));

// Preload critical chunks immediately
if (typeof window !== 'undefined') {
  // Preload home and products immediately
  setTimeout(() => {
    preloadChunk(() => import('../pages/Home'));
    preloadChunk(() => import('../pages/Products'));
  }, 1000);
}