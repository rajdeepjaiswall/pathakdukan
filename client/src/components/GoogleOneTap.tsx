import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Don't show if user is already authenticated
    if (isAuthenticated) return;

    // Don't show if already shown in this session
    if (sessionStorage.getItem('googleOneTapShown')) return;

    // Load Google One Tap script
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGoogleLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isGoogleLoaded || isAuthenticated || hasShownPrompt) return;

    // Show One Tap after 5-6 seconds of browsing
    const timer = setTimeout(() => {
      initializeGoogleOneTap();
    }, 5500); // 5.5 seconds

    return () => clearTimeout(timer);
  }, [isGoogleLoaded, isAuthenticated, hasShownPrompt]);

  const initializeGoogleOneTap = () => {
    if (!window.google?.accounts?.id) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        use_fedcm_for_prompt: true,
      });

      // Show the One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.log('One Tap skipped:', notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
          console.log('One Tap dismissed:', notification.getDismissedReason());
        }
      });

      setHasShownPrompt(true);
      sessionStorage.setItem('googleOneTapShown', 'true');
    } catch (error) {
      console.error('Failed to initialize Google One Tap:', error);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      // Send the Google token to our backend for verification
      const authResponse = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      if (!authResponse.ok) {
        throw new Error('Authentication failed');
      }

      const data = await authResponse.json();
      
      // Login the user with the returned data
      login(data.user, data.token);

      toast({
        title: 'Welcome back! 👋',
        description: `Signed in as ${data.user.email}`,
        duration: 3000,
      });

      // Disable auto-select for future visits to avoid spam
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

    } catch (error: any) {
      console.error('Google One Tap login failed:', error);
      toast({
        title: 'Sign-in failed',
        description: 'Unable to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // This component doesn't render anything visible
  return null;
}