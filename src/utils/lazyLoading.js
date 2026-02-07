// src/utils/lazyLoading.js
import { lazy } from 'react';

// Lazy load heavy pages
export const Admin = lazy(() => import('../pages/Admin'));
export const AdminAffiliates = lazy(() => import('../pages/AdminAffiliates'));
export const Affiliates = lazy(() => import('../pages/Affiliates'));
export const AffiliateDashboard = lazy(() => import('../pages/AffiliateDashboard'));
export const Checkout = lazy(() => import('../pages/Checkout'));
export const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
export const TermsOfUse = lazy(() => import('../pages/TermsOfUse'));
export const DeliveryPolicy = lazy(() => import('../pages/DeliveryPolicy'));
export const ProductDetail = lazy(() => import('../pages/ProductDetail'));
export const AdminUsers = lazy(() => import('../pages/AdminUsers'));
export const Products = lazy(() => import('../pages/Products'));
export const Warranty = lazy(() => import('../pages/Warranty'));
export const PaymentPolicy = lazy(() => import('../pages/PaymentPolicy'));
export const Account = lazy(() => import('../pages/Account'));
export const ReturnRefundPolicy = lazy(() => import('../pages/ReturnRefundPolicy'));
export const Cart = lazy(() => import('../pages/Cart'));
export const Login = lazy(() => import('../pages/Login'));
export const About = lazy(() => import('../pages/About'));
export const ThankYou = lazy(() => import('../pages/ThankYou'));
export const Wishlist = lazy(() => import('../pages/Wishlist'));

// Loading component for suspense
export const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);