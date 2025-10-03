/**
 * Push Notification Manager for Rewardz PWA
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';

// Vapid key for FCM (this should be in environment variables)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY';

class PushNotificationManager {
  private messaging: any = null;
  private permission: NotificationPermission = 'default';
  private token: string | null = null;
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport() {
    this.isSupported = 
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      await this.registerServiceWorker();

      // Initialize Firebase Messaging
      if (app) {
        this.messaging = getMessaging(app);
        
        // Set up foreground message handler
        this.setupForegroundHandler();
      }

      // Check current permission
      this.permission = Notification.permission;

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser",
        variant: "destructive"
      });
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      
      if (this.permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive alerts for new matches and messages"
        });
        
        // Get FCM token
        await this.getToken();
        
        return true;
      } else if (this.permission === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    if (!this.messaging || this.permission !== 'granted') {
      return null;
    }

    try {
      const currentToken = await getToken(this.messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        this.token = currentToken;
        await this.saveTokenToServer(currentToken);
        return currentToken;
      } else {
        console.log('No registration token available');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
    }

    return null;
  }

  /**
   * Save token to server
   */
  private async saveTokenToServer(token: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: token,
        pushNotificationsEnabled: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving token to server:', error);
    }
  }

  /**
   * Setup foreground message handler
   */
  private setupForegroundHandler() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show toast notification
      toast({
        title: payload.notification?.title || 'New Notification',
        description: payload.notification?.body,
        action: payload.data?.actionUrl ? (
          <a href={payload.data.actionUrl} className="underline">
            View
          </a>
        ) : undefined
      });

      // Also show browser notification if page is not focused
      if (document.hidden) {
        this.showNotification(
          payload.notification?.title || 'Rewardz Alert',
          {
            body: payload.notification?.body,
            icon: payload.notification?.icon || '/icons/icon-192x192.png',
            data: payload.data
          }
        );
      }
    });
  }

  /**
   * Show a notification
   */
  showNotification(title: string, options?: NotificationOptions) {
    if (this.permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      // Navigate to action URL if provided
      if (options?.data?.actionUrl) {
        window.location.href = options.data.actionUrl;
      }
      
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.permission === 'granted' && this.token !== null;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(topic: string) {
    if (!this.token) return;

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: this.token,
          topic
        })
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to topic');
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic: string) {
    if (!this.token) return;

    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: this.token,
          topic
        })
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe from topic');
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }

  /**
   * Send test notification
   */
  sendTestNotification() {
    this.showNotification('Test Notification', {
      body: 'This is a test notification from Rewardz',
      icon: '/icons/icon-192x192.png',
      data: {
        test: true,
        timestamp: Date.now()
      }
    });
  }
}

// Create singleton instance
export const pushNotifications = new PushNotificationManager();

// Export notification types
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification templates
export const NotificationTemplates = {
  newMatch: (petName: string, matchScore: number): PushNotificationPayload => ({
    title: '🎉 New Match Found!',
    body: `Potential match for ${petName} with ${matchScore}% confidence`,
    data: {
      type: 'match',
      petName,
      matchScore
    }
  }),

  newMessage: (senderName: string): PushNotificationPayload => ({
    title: '💬 New Message',
    body: `${senderName} sent you a message`,
    data: {
      type: 'message',
      senderName
    }
  }),

  reportVerified: (reportId: string): PushNotificationPayload => ({
    title: '✅ Report Verified',
    body: 'Your report has been verified by our team',
    data: {
      type: 'verification',
      reportId
    }
  }),

  nearbyPet: (species: string, distance: string): PushNotificationPayload => ({
    title: '📍 Pet Spotted Nearby',
    body: `A ${species} was spotted ${distance} from your location`,
    data: {
      type: 'nearby',
      species,
      distance
    }
  }),

  rewardClaimed: (amount: number): PushNotificationPayload => ({
    title: '💰 Reward Claimed',
    body: `$${amount} reward has been claimed for your pet`,
    data: {
      type: 'reward',
      amount
    }
  })
};

// Initialize on app load
if (typeof window !== 'undefined') {
  pushNotifications.initialize();
}