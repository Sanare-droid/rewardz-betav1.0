/**
 * Internationalization (i18n) support for Rewardz
 * Simple translation system with support for multiple languages
 */

import { useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'sw' | 'zu';

export interface Translations {
  [key: string]: string | Translations;
}

// English translations (default)
const en: Translations = {
  common: {
    appName: 'Rewardz',
    tagline: 'Bringing Lost Pets Home',
    search: 'Search',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    close: 'Close',
    share: 'Share',
    download: 'Download',
    print: 'Print'
  },
  navigation: {
    home: 'Home',
    alerts: 'Alerts',
    search: 'Search',
    community: 'Community',
    profile: 'Profile',
    messages: 'Messages',
    notifications: 'Notifications',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout'
  },
  pet: {
    lost: 'Lost',
    found: 'Found',
    reunited: 'Reunited',
    species: 'Species',
    breed: 'Breed',
    color: 'Color',
    name: 'Name',
    description: 'Description',
    lastSeen: 'Last Seen',
    foundAt: 'Found At',
    reward: 'Reward',
    microchip: 'Microchip ID'
  },
  actions: {
    reportLost: 'Report Lost Pet',
    reportFound: 'Report Found Pet',
    viewDetails: 'View Details',
    contact: 'Contact',
    markReunited: 'Mark as Reunited',
    claimReward: 'Claim Reward',
    sendMessage: 'Send Message',
    createPoster: 'Create Poster',
    viewOnMap: 'View on Map'
  },
  messages: {
    welcome: 'Welcome back, {{name}}!',
    noResults: 'No results found',
    matchFound: 'Potential match found!',
    reportCreated: 'Report created successfully',
    reportUpdated: 'Report updated successfully',
    reportDeleted: 'Report deleted successfully',
    messageSent: 'Message sent',
    notificationSent: 'Notification sent',
    errorOccurred: 'An error occurred. Please try again.',
    permissionDenied: 'Permission denied',
    loginRequired: 'Please login to continue'
  },
  auth: {
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    name: 'Name',
    phone: 'Phone',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?"
  }
};

// Spanish translations
const es: Translations = {
  common: {
    appName: 'Rewardz',
    tagline: 'Reuniendo Mascotas Perdidas',
    search: 'Buscar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    submit: 'Enviar',
    close: 'Cerrar',
    share: 'Compartir',
    download: 'Descargar',
    print: 'Imprimir'
  },
  navigation: {
    home: 'Inicio',
    alerts: 'Alertas',
    search: 'Buscar',
    community: 'Comunidad',
    profile: 'Perfil',
    messages: 'Mensajes',
    notifications: 'Notificaciones',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar Sesión'
  },
  pet: {
    lost: 'Perdido',
    found: 'Encontrado',
    reunited: 'Reunido',
    species: 'Especie',
    breed: 'Raza',
    color: 'Color',
    name: 'Nombre',
    description: 'Descripción',
    lastSeen: 'Visto por Última Vez',
    foundAt: 'Encontrado en',
    reward: 'Recompensa',
    microchip: 'ID de Microchip'
  },
  actions: {
    reportLost: 'Reportar Mascota Perdida',
    reportFound: 'Reportar Mascota Encontrada',
    viewDetails: 'Ver Detalles',
    contact: 'Contactar',
    markReunited: 'Marcar como Reunido',
    claimReward: 'Reclamar Recompensa',
    sendMessage: 'Enviar Mensaje',
    createPoster: 'Crear Póster',
    viewOnMap: 'Ver en el Mapa'
  },
  messages: {
    welcome: '¡Bienvenido de vuelta, {{name}}!',
    noResults: 'No se encontraron resultados',
    matchFound: '¡Coincidencia potencial encontrada!',
    reportCreated: 'Reporte creado exitosamente',
    reportUpdated: 'Reporte actualizado exitosamente',
    reportDeleted: 'Reporte eliminado exitosamente',
    messageSent: 'Mensaje enviado',
    notificationSent: 'Notificación enviada',
    errorOccurred: 'Ocurrió un error. Por favor intenta de nuevo.',
    permissionDenied: 'Permiso denegado',
    loginRequired: 'Por favor inicia sesión para continuar'
  },
  auth: {
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    forgotPassword: '¿Olvidaste tu Contraseña?',
    resetPassword: 'Restablecer Contraseña',
    name: 'Nombre',
    phone: 'Teléfono',
    createAccount: 'Crear Cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?'
  }
};

// French translations
const fr: Translations = {
  common: {
    appName: 'Rewardz',
    tagline: 'Retrouver les Animaux Perdus',
    search: 'Rechercher',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    submit: 'Soumettre',
    close: 'Fermer',
    share: 'Partager',
    download: 'Télécharger',
    print: 'Imprimer'
  },
  navigation: {
    home: 'Accueil',
    alerts: 'Alertes',
    search: 'Rechercher',
    community: 'Communauté',
    profile: 'Profil',
    messages: 'Messages',
    notifications: 'Notifications',
    settings: 'Paramètres',
    help: 'Aide',
    logout: 'Déconnexion'
  },
  pet: {
    lost: 'Perdu',
    found: 'Trouvé',
    reunited: 'Réuni',
    species: 'Espèce',
    breed: 'Race',
    color: 'Couleur',
    name: 'Nom',
    description: 'Description',
    lastSeen: 'Vu Pour la Dernière Fois',
    foundAt: 'Trouvé à',
    reward: 'Récompense',
    microchip: 'ID de Micropuce'
  },
  actions: {
    reportLost: 'Signaler un Animal Perdu',
    reportFound: 'Signaler un Animal Trouvé',
    viewDetails: 'Voir les Détails',
    contact: 'Contact',
    markReunited: 'Marquer comme Réuni',
    claimReward: 'Réclamer la Récompense',
    sendMessage: 'Envoyer un Message',
    createPoster: 'Créer une Affiche',
    viewOnMap: 'Voir sur la Carte'
  },
  messages: {
    welcome: 'Bienvenue, {{name}}!',
    noResults: 'Aucun résultat trouvé',
    matchFound: 'Correspondance potentielle trouvée!',
    reportCreated: 'Rapport créé avec succès',
    reportUpdated: 'Rapport mis à jour avec succès',
    reportDeleted: 'Rapport supprimé avec succès',
    messageSent: 'Message envoyé',
    notificationSent: 'Notification envoyée',
    errorOccurred: 'Une erreur est survenue. Veuillez réessayer.',
    permissionDenied: 'Permission refusée',
    loginRequired: 'Veuillez vous connecter pour continuer'
  },
  auth: {
    login: 'Connexion',
    signup: "S'inscrire",
    email: 'Email',
    password: 'Mot de Passe',
    confirmPassword: 'Confirmer le Mot de Passe',
    forgotPassword: 'Mot de Passe Oublié?',
    resetPassword: 'Réinitialiser le Mot de Passe',
    name: 'Nom',
    phone: 'Téléphone',
    createAccount: 'Créer un Compte',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    dontHaveAccount: "Vous n'avez pas de compte?"
  }
};

// Swahili translations (East Africa)
const sw: Translations = {
  common: {
    appName: 'Rewardz',
    tagline: 'Kurudisha Wanyama Waliopotea',
    search: 'Tafuta',
    cancel: 'Ghairi',
    save: 'Hifadhi',
    delete: 'Futa',
    edit: 'Hariri',
    loading: 'Inapakia...',
    error: 'Kosa',
    success: 'Mafanikio',
    confirm: 'Thibitisha',
    back: 'Nyuma',
    next: 'Mbele',
    submit: 'Tuma',
    close: 'Funga',
    share: 'Shiriki',
    download: 'Pakua',
    print: 'Chapisha'
  },
  navigation: {
    home: 'Nyumbani',
    alerts: 'Tahadhari',
    search: 'Tafuta',
    community: 'Jamii',
    profile: 'Wasifu',
    messages: 'Ujumbe',
    notifications: 'Arifa',
    settings: 'Mipangilio',
    help: 'Msaada',
    logout: 'Ondoka'
  },
  pet: {
    lost: 'Amepotea',
    found: 'Amepatikana',
    reunited: 'Amerudi',
    species: 'Aina',
    breed: 'Mbegu',
    color: 'Rangi',
    name: 'Jina',
    description: 'Maelezo',
    lastSeen: 'Alionekana Mwisho',
    foundAt: 'Alipatikana',
    reward: 'Tuzo',
    microchip: 'Kitambulisho cha Microchip'
  },
  actions: {
    reportLost: 'Ripoti Mnyama Aliyepotea',
    reportFound: 'Ripoti Mnyama Aliyepatikana',
    viewDetails: 'Ona Maelezo',
    contact: 'Wasiliana',
    markReunited: 'Weka Alama Amerudi',
    claimReward: 'Dai Tuzo',
    sendMessage: 'Tuma Ujumbe',
    createPoster: 'Tengeneza Bango',
    viewOnMap: 'Ona Kwenye Ramani'
  },
  messages: {
    welcome: 'Karibu tena, {{name}}!',
    noResults: 'Hakuna matokeo yaliyopatikana',
    matchFound: 'Mechi inayoweza kupatikana!',
    reportCreated: 'Ripoti imeundwa kwa mafanikio',
    reportUpdated: 'Ripoti imesasishwa kwa mafanikio',
    reportDeleted: 'Ripoti imefutwa kwa mafanikio',
    messageSent: 'Ujumbe umetumwa',
    notificationSent: 'Arifa imetumwa',
    errorOccurred: 'Kosa limetokea. Tafadhali jaribu tena.',
    permissionDenied: 'Ruhusa imekataliwa',
    loginRequired: 'Tafadhali ingia ili uendelee'
  },
  auth: {
    login: 'Ingia',
    signup: 'Jisajili',
    email: 'Barua Pepe',
    password: 'Nenosiri',
    confirmPassword: 'Thibitisha Nenosiri',
    forgotPassword: 'Umesahau Nenosiri?',
    resetPassword: 'Weka Upya Nenosiri',
    name: 'Jina',
    phone: 'Simu',
    createAccount: 'Tengeneza Akaunti',
    alreadyHaveAccount: 'Una akaunti tayari?',
    dontHaveAccount: 'Hauna akaunti?'
  }
};

// Store translations
const translations: Record<Language, Translations> = {
  en,
  es,
  fr,
  sw,
  zu: en // Fallback to English for Zulu (not implemented)
};

// Current language state
let currentLanguage: Language = 'en';

// Get saved language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('language') as Language;
  if (saved && translations[saved]) {
    currentLanguage = saved;
  } else {
    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in translations) {
      currentLanguage = browserLang as Language;
    }
  }
}

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

/**
 * Set current language
 */
export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
    // Trigger language change event
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  }
}

/**
 * Get translation for a key
 */
export function t(key: string, params?: Record<string, any>): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters
  if (params) {
    for (const [param, val] of Object.entries(params)) {
      value = value.replace(`{{${param}}}`, String(val));
    }
  }
  
  return value;
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'sw', name: 'Kiswahili' }
  ];
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);
  
  return {
    t,
    currentLanguage: getCurrentLanguage(),
    setLanguage,
    languages: getAvailableLanguages()
  };
}

// Export for direct usage
export default {
  t,
  getCurrentLanguage,
  setLanguage,
  getAvailableLanguages
};