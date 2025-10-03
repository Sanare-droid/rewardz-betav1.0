/**
 * Notification system for Rewardz
 * Handles in-app, push, and email notifications
 */

import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  limit,
  getDoc
} from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';

export interface Notification {
  id?: string;
  userId: string;
  type: 'match' | 'message' | 'reward' | 'system' | 'alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: any;
  actionUrl?: string;
  icon?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  matchAlerts: boolean;
  messageAlerts: boolean;
  rewardAlerts: boolean;
  systemAlerts: boolean;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    // Check user preferences and send additional notifications
    await sendAdditionalNotifications(notification);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Send push/email/SMS notifications based on user preferences
 */
async function sendAdditionalNotifications(
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
) {
  try {
    // Get user preferences
    const userDoc = await getDoc(doc(db, 'users', notification.userId));
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    const prefs = userData.notificationPreferences as NotificationPreferences;
    
    if (!prefs) return;
    
    // Check if this type of notification is enabled
    const typeEnabled = {
      match: prefs.matchAlerts,
      message: prefs.messageAlerts,
      reward: prefs.rewardAlerts,
      system: prefs.systemAlerts,
      alert: true
    }[notification.type];
    
    if (!typeEnabled) return;
    
    // Send email notification
    if (prefs.email && userData.email) {
      await sendEmailNotification(userData.email, notification);
    }
    
    // Send push notification
    if (prefs.push && userData.fcmToken) {
      await sendPushNotification(userData.fcmToken, notification);
    }
    
    // Send SMS notification (if implemented)
    if (prefs.sms && userData.phone) {
      await sendSMSNotification(userData.phone, notification);
    }
  } catch (error) {
    console.error('Error sending additional notifications:', error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
) {
  try {
    const response = await fetch('/api/notify/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        subject: notification.title,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `
            <a href="${window.location.origin}${notification.actionUrl}" 
               style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              View Details
            </a>
          ` : ''}
        `
      })
    });
    
    if (!response.ok) {
      console.error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * Send push notification (requires FCM setup)
 */
async function sendPushNotification(
  fcmToken: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
) {
  // This would typically call a server endpoint that uses Firebase Admin SDK
  console.log('Push notification would be sent to:', fcmToken);
  // Implementation depends on backend setup
}

/**
 * Send SMS notification (requires SMS service setup)
 */
async function sendSMSNotification(
  phone: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
) {
  // This would typically call a server endpoint that uses SMS service like Twilio
  console.log('SMS notification would be sent to:', phone);
  // Implementation depends on backend setup
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        isRead: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = [];
      let hasNewUnread = false;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data
        } as Notification);
        
        // Check for new unread notifications
        if (!data.isRead && data.createdAt?.seconds > Date.now() / 1000 - 5) {
          hasNewUnread = true;
        }
      });
      
      // Show toast for new notifications
      if (hasNewUnread && notifications.length > 0) {
        const latest = notifications[0];
        toast({
          title: latest.title,
          description: `${latest.message}${latest.actionUrl ? ` - ${latest.actionUrl}` : ''}`,
        });
      }
      
      onNotification(notifications);
    },
    (error) => {
      console.error('Error subscribing to notifications:', error);
      onError?.(error as Error);
    }
  );
  
  return unsubscribe;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      notificationPreferences: preferences,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Request permission for push notifications
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

/**
 * Initialize notification system for current user
 */
export async function initializeNotifications(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  // Request push permission
  const hasPushPermission = await requestPushPermission();
  
  if (hasPushPermission) {
    // In a real app, you would get FCM token here and save it
    // const token = await getMessaging().getToken();
    // await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
    
    console.log('Push notifications enabled');
  }
  
  // Set default preferences if not exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists() && !userDoc.data().notificationPreferences) {
    await updateNotificationPreferences(user.uid, {
      email: true,
      push: true,
      sms: false,
      matchAlerts: true,
      messageAlerts: true,
      rewardAlerts: true,
      systemAlerts: true
    });
  }
}

/**
 * Create common notification types
 */
export const NotificationTemplates = {
  matchFound: (matchScore: number, petName: string, reportId: string) => ({
    type: 'match' as const,
    title: 'Potential Match Found!',
    message: `We found a ${matchScore}% match for ${petName}`,
    actionUrl: `/match?report=${reportId}`,
    icon: '🎉'
  }),
  
  messageReceived: (senderName: string, reportId: string) => ({
    type: 'message' as const,
    title: 'New Message',
    message: `${senderName} sent you a message`,
    actionUrl: `/messages?report=${reportId}`,
    icon: '💬'
  }),
  
  reportUpdated: (reportTitle: string, reportId: string) => ({
    type: 'alert' as const,
    title: 'Report Updated',
    message: `${reportTitle} has been updated`,
    actionUrl: `/report/${reportId}`,
    icon: '📝'
  }),
  
  rewardClaimed: (amount: number, petName: string) => ({
    type: 'reward' as const,
    title: 'Reward Claimed!',
    message: `$${amount} reward for finding ${petName} has been claimed`,
    actionUrl: '/profile',
    icon: '💰'
  }),
  
  systemAlert: (message: string) => ({
    type: 'system' as const,
    title: 'System Notification',
    message,
    icon: 'ℹ️'
  })
};