/**
 * Internationalization (i18n) Support for Rewardz
 */

import { createContext, useContext } from 'react';

// Supported languages
export const LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  sw: 'Kiswahili'
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Translation keys
export interface Translations {
  // Navigation
  'nav.home': string;
  'nav.search': string;
  'nav.alerts': string;
  'nav.community': string;
  'nav.profile': string;
  'nav.messages': string;
  'nav.notifications': string;
  
  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.view': string;
  'common.share': string;
  'common.download': string;
  'common.search': string;
  'common.filter': string;
  'common.sort': string;
  'common.back': string;
  'common.next': string;
  'common.submit': string;
  'common.close': string;
  
  // Auth
  'auth.login': string;
  'auth.signup': string;
  'auth.logout': string;
  'auth.forgotPassword': string;
  'auth.resetPassword': string;
  'auth.email': string;
  'auth.password': string;
  'auth.confirmPassword': string;
  'auth.name': string;
  
  // Pet Report
  'report.lost': string;
  'report.found': string;
  'report.title': string;
  'report.petName': string;
  'report.species': string;
  'report.breed': string;
  'report.color': string;
  'report.location': string;
  'report.lastSeen': string;
  'report.reward': string;
  'report.description': string;
  'report.contact': string;
  'report.status.open': string;
  'report.status.closed': string;
  'report.status.reunited': string;
  
  // Matching
  'match.title': string;
  'match.score': string;
  'match.confidence': string;
  'match.reasons': string;
  'match.accept': string;
  'match.reject': string;
  'match.contact': string;
  
  // Messages
  'messages.title': string;
  'messages.newMessage': string;
  'messages.send': string;
  'messages.typeMessage': string;
  'messages.noMessages': string;
  'messages.unread': string;
  
  // Notifications
  'notifications.title': string;
  'notifications.markRead': string;
  'notifications.markAllRead': string;
  'notifications.noNotifications': string;
  'notifications.settings': string;
  
  // Community
  'community.leaderboard': string;
  'community.points': string;
  'community.rank': string;
  'community.badges': string;
  'community.posts': string;
  'community.comments': string;
  
  // Settings
  'settings.title': string;
  'settings.account': string;
  'settings.privacy': string;
  'settings.notifications': string;
  'settings.language': string;
  'settings.theme': string;
  'settings.help': string;
  
  // Success Messages
  'success.reportCreated': string;
  'success.reportUpdated': string;
  'success.reportDeleted': string;
  'success.matchFound': string;
  'success.messageSent': string;
  'success.profileUpdated': string;
  
  // Error Messages
  'error.generic': string;
  'error.network': string;
  'error.notFound': string;
  'error.unauthorized': string;
  'error.validation': string;
  'error.fileSize': string;
}

// English translations (default)
const en: Translations = {
  // Navigation
  'nav.home': 'Home',
  'nav.search': 'Search',
  'nav.alerts': 'Alerts',
  'nav.community': 'Community',
  'nav.profile': 'Profile',
  'nav.messages': 'Messages',
  'nav.notifications': 'Notifications',
  
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.view': 'View',
  'common.share': 'Share',
  'common.download': 'Download',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.submit': 'Submit',
  'common.close': 'Close',
  
  // Auth
  'auth.login': 'Log In',
  'auth.signup': 'Sign Up',
  'auth.logout': 'Log Out',
  'auth.forgotPassword': 'Forgot Password?',
  'auth.resetPassword': 'Reset Password',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.name': 'Name',
  
  // Pet Report
  'report.lost': 'Lost',
  'report.found': 'Found',
  'report.title': 'Report Pet',
  'report.petName': 'Pet Name',
  'report.species': 'Species',
  'report.breed': 'Breed',
  'report.color': 'Color',
  'report.location': 'Location',
  'report.lastSeen': 'Last Seen',
  'report.reward': 'Reward',
  'report.description': 'Description',
  'report.contact': 'Contact',
  'report.status.open': 'Open',
  'report.status.closed': 'Closed',
  'report.status.reunited': 'Reunited',
  
  // Matching
  'match.title': 'Potential Match Found!',
  'match.score': 'Match Score',
  'match.confidence': 'Confidence',
  'match.reasons': 'Why we think it\'s a match',
  'match.accept': 'Yes, it\'s a match!',
  'match.reject': 'No, not a match',
  'match.contact': 'Contact Owner',
  
  // Messages
  'messages.title': 'Messages',
  'messages.newMessage': 'New Message',
  'messages.send': 'Send',
  'messages.typeMessage': 'Type a message...',
  'messages.noMessages': 'No messages yet',
  'messages.unread': 'unread',
  
  // Notifications
  'notifications.title': 'Notifications',
  'notifications.markRead': 'Mark as read',
  'notifications.markAllRead': 'Mark all as read',
  'notifications.noNotifications': 'No notifications',
  'notifications.settings': 'Notification Settings',
  
  // Community
  'community.leaderboard': 'Leaderboard',
  'community.points': 'points',
  'community.rank': 'Rank',
  'community.badges': 'Badges',
  'community.posts': 'Posts',
  'community.comments': 'Comments',
  
  // Settings
  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.privacy': 'Privacy',
  'settings.notifications': 'Notifications',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.help': 'Help & Support',
  
  // Success Messages
  'success.reportCreated': 'Report created successfully',
  'success.reportUpdated': 'Report updated successfully',
  'success.reportDeleted': 'Report deleted successfully',
  'success.matchFound': 'Match found!',
  'success.messageSent': 'Message sent',
  'success.profileUpdated': 'Profile updated',
  
  // Error Messages
  'error.generic': 'Something went wrong',
  'error.network': 'Network error. Please check your connection',
  'error.notFound': 'Not found',
  'error.unauthorized': 'Unauthorized access',
  'error.validation': 'Please check your input',
  'error.fileSize': 'File size too large'
};

// Spanish translations
const es: Translations = {
  // Navigation
  'nav.home': 'Inicio',
  'nav.search': 'Buscar',
  'nav.alerts': 'Alertas',
  'nav.community': 'Comunidad',
  'nav.profile': 'Perfil',
  'nav.messages': 'Mensajes',
  'nav.notifications': 'Notificaciones',
  
  // Common
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Éxito',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.view': 'Ver',
  'common.share': 'Compartir',
  'common.download': 'Descargar',
  'common.search': 'Buscar',
  'common.filter': 'Filtrar',
  'common.sort': 'Ordenar',
  'common.back': 'Atrás',
  'common.next': 'Siguiente',
  'common.submit': 'Enviar',
  'common.close': 'Cerrar',
  
  // Auth
  'auth.login': 'Iniciar Sesión',
  'auth.signup': 'Registrarse',
  'auth.logout': 'Cerrar Sesión',
  'auth.forgotPassword': '¿Olvidaste tu contraseña?',
  'auth.resetPassword': 'Restablecer Contraseña',
  'auth.email': 'Correo Electrónico',
  'auth.password': 'Contraseña',
  'auth.confirmPassword': 'Confirmar Contraseña',
  'auth.name': 'Nombre',
  
  // Pet Report
  'report.lost': 'Perdido',
  'report.found': 'Encontrado',
  'report.title': 'Reportar Mascota',
  'report.petName': 'Nombre de Mascota',
  'report.species': 'Especie',
  'report.breed': 'Raza',
  'report.color': 'Color',
  'report.location': 'Ubicación',
  'report.lastSeen': 'Visto por Última Vez',
  'report.reward': 'Recompensa',
  'report.description': 'Descripción',
  'report.contact': 'Contacto',
  'report.status.open': 'Abierto',
  'report.status.closed': 'Cerrado',
  'report.status.reunited': 'Reunido',
  
  // Matching
  'match.title': '¡Posible Coincidencia Encontrada!',
  'match.score': 'Puntuación de Coincidencia',
  'match.confidence': 'Confianza',
  'match.reasons': 'Por qué creemos que coincide',
  'match.accept': '¡Sí, es una coincidencia!',
  'match.reject': 'No, no coincide',
  'match.contact': 'Contactar Dueño',
  
  // Messages
  'messages.title': 'Mensajes',
  'messages.newMessage': 'Nuevo Mensaje',
  'messages.send': 'Enviar',
  'messages.typeMessage': 'Escribe un mensaje...',
  'messages.noMessages': 'No hay mensajes',
  'messages.unread': 'sin leer',
  
  // Notifications
  'notifications.title': 'Notificaciones',
  'notifications.markRead': 'Marcar como leído',
  'notifications.markAllRead': 'Marcar todo como leído',
  'notifications.noNotifications': 'Sin notificaciones',
  'notifications.settings': 'Configuración de Notificaciones',
  
  // Community
  'community.leaderboard': 'Tabla de Posiciones',
  'community.points': 'puntos',
  'community.rank': 'Rango',
  'community.badges': 'Insignias',
  'community.posts': 'Publicaciones',
  'community.comments': 'Comentarios',
  
  // Settings
  'settings.title': 'Configuración',
  'settings.account': 'Cuenta',
  'settings.privacy': 'Privacidad',
  'settings.notifications': 'Notificaciones',
  'settings.language': 'Idioma',
  'settings.theme': 'Tema',
  'settings.help': 'Ayuda y Soporte',
  
  // Success Messages
  'success.reportCreated': 'Reporte creado exitosamente',
  'success.reportUpdated': 'Reporte actualizado exitosamente',
  'success.reportDeleted': 'Reporte eliminado exitosamente',
  'success.matchFound': '¡Coincidencia encontrada!',
  'success.messageSent': 'Mensaje enviado',
  'success.profileUpdated': 'Perfil actualizado',
  
  // Error Messages
  'error.generic': 'Algo salió mal',
  'error.network': 'Error de red. Por favor verifica tu conexión',
  'error.notFound': 'No encontrado',
  'error.unauthorized': 'Acceso no autorizado',
  'error.validation': 'Por favor verifica tu entrada',
  'error.fileSize': 'Archivo demasiado grande'
};

// Translation map
export const translations: Record<LanguageCode, Translations> = {
  en,
  es,
  // Other languages would have basic English fallback
  fr: en,
  de: en,
  pt: en,
  zh: en,
  ar: en,
  hi: en,
  sw: en
};

// i18n Context
interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof Translations, params?: Record<string, any>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

export const I18nProvider = I18nContext.Provider;

// Helper function to get translation
export function getTranslation(
  language: LanguageCode,
  key: keyof Translations,
  params?: Record<string, any>
): string {
  const translation = translations[language]?.[key] || translations.en[key] || key;
  
  if (!params) return translation;
  
  // Replace parameters in translation
  return Object.entries(params).reduce(
    (str, [param, value]) => str.replace(`{{${param}}}`, String(value)),
    translation
  );
}

// Get browser language
export function getBrowserLanguage(): LanguageCode {
  const browserLang = navigator.language.split('-')[0];
  return (browserLang in LANGUAGES ? browserLang : 'en') as LanguageCode;
}

// Get text direction for language
export function getTextDirection(language: LanguageCode): 'ltr' | 'rtl' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

// Format number based on locale
export function formatNumber(value: number, language: LanguageCode): string {
  const locales: Record<LanguageCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    sw: 'sw-KE'
  };
  
  return new Intl.NumberFormat(locales[language]).format(value);
}

// Format date based on locale
export function formatDate(date: Date, language: LanguageCode, options?: Intl.DateTimeFormatOptions): string {
  const locales: Record<LanguageCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    sw: 'sw-KE'
  };
  
  return new Intl.DateTimeFormat(locales[language], options).format(date);
}

// Format currency
export function formatCurrency(amount: number, language: LanguageCode, currency = 'USD'): string {
  const locales: Record<LanguageCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    sw: 'sw-KE'
  };
  
  return new Intl.NumberFormat(locales[language], {
    style: 'currency',
    currency
  }).format(amount);
}