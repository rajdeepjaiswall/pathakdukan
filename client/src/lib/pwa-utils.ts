// PWA utility functions
export const isPWAInstalled = (): boolean => {
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppChrome = (window.navigator as any).standalone === true;
  return isStandalone || isInWebAppChrome;
};

export const isPWASupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPWASupported()) {
    console.log('PWA not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('Service Worker registered successfully:', registration);
    
    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, prompt user to update
            if (confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isPWASupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

export const checkForUpdates = async (): Promise<void> => {
  if (!isPWASupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
};

// Network status utilities
export const getNetworkStatus = (): { online: boolean; effectiveType?: string } => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown'
  };
};

export const addNetworkListener = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// App lifecycle utilities
export const addVisibilityChangeListener = (callback: (visible: boolean) => void): (() => void) => {
  const handleVisibilityChange = () => {
    callback(!document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Storage utilities for offline support
export const setOfflineData = (key: string, data: any): void => {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save offline data:', error);
  }
};

export const getOfflineData = (key: string, maxAge: number = 24 * 60 * 60 * 1000): any => {
  try {
    const stored = localStorage.getItem(`offline_${key}`);
    if (!stored) return null;

    const { data, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(`offline_${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return null;
  }
};

export const clearOfflineData = (key?: string): void => {
  try {
    if (key) {
      localStorage.removeItem(`offline_${key}`);
    } else {
      // Clear all offline data
      Object.keys(localStorage)
        .filter(k => k.startsWith('offline_'))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
};