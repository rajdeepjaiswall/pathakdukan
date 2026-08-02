import { useState, useEffect } from 'react';
import { X, Download, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAPopupNotification() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed today
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const dismissedToday = localStorage.getItem('pwa-popup-dismissed') === new Date().toDateString();
    
    if (isInstalled || dismissedToday || dismissed) return;

    // Show popup after 12 seconds of browsing
    const timer = setTimeout(() => {
      setShow(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleInstall = () => {
    // This will trigger the InstallPrompt component or show manual instructions
    const event = new CustomEvent('showInstallPrompt');
    window.dispatchEvent(event);
    handleDismiss();
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-popup-dismissed', new Date().toDateString());
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-xs animate-in slide-in-from-top-4 duration-700">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-3 relative overflow-hidden">
        {/* Sparkle animation */}
        <div className="absolute top-2 right-8">
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Star className="h-4 w-4" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-xs mb-1">Install Our App!</h3>
            <p className="text-[10px] text-white/90 mb-2">
              Get faster loading and offline access!
            </p>
            
            <div className="flex gap-1.5">
              <Button 
                onClick={handleInstall}
                size="sm" 
                className="bg-white text-purple-600 hover:bg-white/90 text-[10px] font-semibold px-2 py-1 h-6"
              >
                <Download className="h-2.5 w-2.5 mr-1" />
                Install
              </Button>
              <Button 
                onClick={handleDismiss}
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/20 text-[10px] px-2 py-1 h-6"
              >
                Later
              </Button>
            </div>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}