/**
 * Lazy-loaded components for code splitting
 */
import { lazy } from 'react';

// Page components
export const LazyAlerts = lazy(() => import('@/pages/Alerts'));
export const LazyAlertsMap = lazy(() => import('@/pages/AlertsMap'));
export const LazySearch = lazy(() => import('@/pages/Search'));
export const LazyCommunity = lazy(() => import('@/pages/Community'));
export const LazyProfile = lazy(() => import('@/pages/Profile'));
export const LazySaved = lazy(() => import('@/pages/Saved'));
export const LazyMessages = lazy(() => import('@/pages/Messages'));
export const LazyReportLost = lazy(() => import('@/pages/ReportLost'));
export const LazyReportFound = lazy(() => import('@/pages/ReportFound'));
export const LazyPayment = lazy(() => import('@/pages/Payment'));
export const LazyPaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
export const LazyReportSubmitted = lazy(() => import('@/pages/ReportSubmitted'));
export const LazyConfirmReunion = lazy(() => import('@/pages/ConfirmReunion'));
export const LazyClaimReward = lazy(() => import('@/pages/ClaimReward'));
export const LazyMatch = lazy(() => import('@/pages/Match'));
export const LazyOwnerContact = lazy(() => import('@/pages/OwnerContact'));
export const LazyReportView = lazy(() => import('@/pages/ReportView'));
export const LazyEditReport = lazy(() => import('@/pages/EditReport'));
export const LazyPoster = lazy(() => import('@/pages/Poster'));
export const LazyDialer = lazy(() => import('@/pages/Dialer'));
export const LazyNotificationSettings = lazy(() => import('@/pages/NotificationSettings'));
export const LazyMessageSettings = lazy(() => import('@/pages/MessageSettings'));
export const LazyAccount = lazy(() => import('@/pages/Account'));
export const LazyHelp = lazy(() => import('@/pages/Help'));
export const LazyPrivacy = lazy(() => import('@/pages/Privacy'));
export const LazySavedSearches = lazy(() => import('@/pages/SavedSearches'));
export const LazyPets = lazy(() => import('@/pages/Pets'));
export const LazyPetEdit = lazy(() => import('@/pages/PetEdit'));
export const LazyPetView = lazy(() => import('@/pages/PetView'));
export const LazyAdmin = lazy(() => import('@/pages/Admin'));
export const LazyPetOnboarding = lazy(() => import('@/pages/PetOnboarding'));

// Auth components
export const LazyLogin = lazy(() => import('@/pages/Login'));
export const LazySignup = lazy(() => import('@/pages/Signup'));
export const LazyResetPassword = lazy(() => import('@/pages/ResetPassword'));
export const LazyOnboarding = lazy(() => import('@/pages/Onboarding'));
export const LazyGetStarted = lazy(() => import('@/pages/GetStarted'));

// Utility components
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));
export const LazySplash = lazy(() => import('@/pages/Splash'));
export const LazyNotifications = lazy(() => import('@/pages/Notifications'));
