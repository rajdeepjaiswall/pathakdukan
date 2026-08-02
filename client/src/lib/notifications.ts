// Push notification service for order status updates
const VAPID_PUBLIC_KEY = 'BK8f6YSEAoXkI0c3PfAhJ2z_kF0hNd9nJ5RFpYqTZ2-QzF8-3qG2xfK-7L4dS1F0';

export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    // Check if browser supports notifications
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered successfully');

      // Subscribe to push notifications
      await this.subscribeToPush();
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  private async subscribeToPush(): Promise<void> {
    if (!this.registration) return;

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      this.subscription = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      console.log('Subscribed to push notifications');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options,
      });
    }
  }

  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

// Order status notification helpers
export const sendOrderStatusNotification = async (orderId: number, status: string, orderNumber: string) => {
  const statusMessages: Record<string, { title: string; body: string; icon: string }> = {
    pending: {
      title: 'Order Confirmed! 🎉',
      body: `Your order #${orderNumber} has been confirmed and is being prepared.`,
      icon: '⏳',
    },
    getting_ready: {
      title: 'Order in Progress 👨‍🍳',
      body: `Your order #${orderNumber} is being prepared by our bakers.`,
      icon: '🥧',
    },
    packed: {
      title: 'Order Packed! 📦',
      body: `Your order #${orderNumber} has been packed and is ready for dispatch.`,
      icon: '📦',
    },
    dispatched: {
      title: 'Order Dispatched! 🚚',
      body: `Your order #${orderNumber} has been dispatched and is on its way.`,
      icon: '🚚',
    },
    shipped: {
      title: 'Order Shipped! 🚛',
      body: `Your order #${orderNumber} is out for delivery.`,
      icon: '🚛',
    },
    delivered: {
      title: 'Order Delivered! ✅',
      body: `Your order #${orderNumber} has been delivered successfully. Thank you for shopping with Pathak Bhandar!`,
      icon: '✅',
    },
    cancelled: {
      title: 'Order Cancelled ❌',
      body: `Your order #${orderNumber} has been cancelled as requested.`,
      icon: '❌',
    },
  };

  const notification = statusMessages[status];
  if (notification) {
    const notificationService = NotificationService.getInstance();
    await notificationService.showLocalNotification(notification.title, {
      body: notification.body,
      icon: '/logo.png',
      tag: `order-${orderId}`,
      data: { orderId, status, orderNumber },
      actions: [
        {
          action: 'view',
          title: 'View Order',
        },
      ],
    });
  }
};

export default NotificationService;