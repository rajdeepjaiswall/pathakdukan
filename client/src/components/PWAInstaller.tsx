import { useEffect } from 'react';
import { registerServiceWorker, isPWASupported } from '@/lib/pwa-utils';
import NotificationService from '@/lib/notifications';

export default function PWAInstaller() {
  useEffect(() => {
    const initializePWA = async () => {
      if (!isPWASupported()) {
        console.log('PWA features not supported in this browser');
        return;
      }

      try {
        // Register service worker
        const registration = await registerServiceWorker();
        if (registration) {
          console.log('PWA features initialized successfully');
          
          // Initialize notifications after service worker is ready
          const notificationService = NotificationService.getInstance();
          await notificationService.initialize();
        }
      } catch (error) {
        console.error('Failed to initialize PWA features:', error);
      }
    };

    initializePWA();
  }, []);

  return null; // This component doesn't render anything
}