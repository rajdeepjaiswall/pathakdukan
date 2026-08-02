import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Star, Zap, Wifi, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppChrome = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppChrome);

    // Don't show if already dismissed today
    const dismissedToday = localStorage.getItem('install-prompt-dismissed') === new Date().toDateString();
    if (dismissedToday) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show immediately when browser supports it
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // For browsers that don't fire beforeinstallprompt, show after delay
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled && !dismissedToday) {
        setShowInstallPrompt(true);
      }
    }, 10000); // Show after 10 seconds of browsing

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    } else {
      // Show manual install instructions for browsers without native support
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    if (isIOS) {
      message = 'To install:\n1. Tap the Share button (□↗)\n2. Select "Add to Home Screen"\n3. Tap "Add"';
    } else if (isAndroid) {
      message = 'To install:\n1. Tap the menu (⋮)\n2. Select "Add to Home screen" or "Install app"';
    } else {
      message = 'To install:\n1. Look for the install icon in the address bar\n2. Or check browser menu for "Install" option';
    }
    
    alert(`Install Pathak Bhandar App\n\n${message}`);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again today
    localStorage.setItem('install-prompt-dismissed', new Date().toDateString());
  };

  // Don't show if already installed or dismissed today
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs animate-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white shadow-lg border-0 relative overflow-hidden">
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        
        <CardContent className="p-3 relative">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Install App</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] mt-0.5">
                  <Star className="h-2 w-2 mr-1" />
                  Better Experience
                </Badge>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-xs text-white/90 mb-3 leading-relaxed">
            Get faster loading and offline access!
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="bg-white text-orange-600 hover:bg-white/90 flex-1 font-semibold text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
            <Button 
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 px-2 text-xs"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}