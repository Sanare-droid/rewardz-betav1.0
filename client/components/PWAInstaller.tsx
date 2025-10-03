import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Bell } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if install prompt was previously dismissed
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show banner again after 7 days
    if (dismissed && daysSinceDismissed < 7) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      toast({
        title: "App Installed!",
        description: "Rewardz has been added to your home screen"
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instructions for browsers that don't support beforeinstallprompt
      showManualInstallInstructions();
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallBanner(false);
      } else {
        console.log('User dismissed the install prompt');
        // Remember dismissal for 7 days
        localStorage.setItem('pwa_install_dismissed', Date.now().toString());
        setShowInstallBanner(false);
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        subscribeToPushNotifications();
        
        toast({
          title: "Notifications enabled!",
          description: "You'll now receive alerts for new matches and messages"
        });
        
        // Show a test notification
        new Notification('Rewardz Notifications Active', {
          body: 'You will be notified of important updates',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png'
        });
      } else if (permission === 'denied') {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        return;
      }
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'
        )
      });
      
      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
      
      console.log('Subscribed to push notifications');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `
        To install Rewardz on iOS:
        1. Tap the Share button in Safari
        2. Select "Add to Home Screen"
        3. Tap "Add" to install
      `;
    } else if (isAndroid) {
      instructions = `
        To install Rewardz on Android:
        1. Tap the menu button (3 dots) in Chrome
        2. Select "Add to Home screen"
        3. Tap "Add" to install
      `;
    } else {
      instructions = `
        To install Rewardz:
        1. Click the install button in your browser's address bar
        2. Or use your browser's menu to "Install" or "Add to Home Screen"
      `;
    }
    
    toast({
      title: "Install Rewardz",
      description: instructions,
      duration: 10000
    });
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Don't show anything if already installed
  if (isInstalled) {
    // Show notification permission request if not granted
    if (notificationPermission !== 'granted') {
      return (
        <Card className="mb-4 border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get instant alerts when pets matching your searches are found
                </p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  // Show install banner
  if (showInstallBanner) {
    return (
      <Card className="mb-4 border-primary bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Install Rewardz App</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add to your home screen for quick access, offline support, and notifications
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleInstallClick}>
                      <Download className="h-4 w-4 mr-1" />
                      Install App
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDismiss}>
                      Not Now
                    </Button>
                  </div>
                </div>
                <button 
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}