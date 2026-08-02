import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { PopupBanner as PopupBannerType } from '@shared/schema';

const isPopupVisible = (banner: PopupBannerType) => {
  if (banner.showOnce) {
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
    if (dismissedBanners.includes(banner.id)) return false;
  }

  const now = new Date();
  if (banner.startDate && new Date(banner.startDate) > now) return false;
  if (banner.endDate && new Date(banner.endDate) < now) return false;

  return true;
};

export default function PopupBanner() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<PopupBannerType | null>(null);

  // Public list of active popup banners — available to all visitors
  const { data: banners } = useQuery<PopupBannerType[]>({
    queryKey: ['/api/popup-banners/active'],
  });

  useEffect(() => {
    if (!banners || banners.length === 0) return;

    // 1) After-login popup (only if just signed in)
    const justLoggedIn = sessionStorage.getItem('just_logged_in') === 'true';
    if (isAuthenticated && justLoggedIn) {
      const loginBanner = banners.find(
        (b) => b.triggerType === 'login' && isPopupVisible(b),
      );
      if (loginBanner) {
        setCurrentBanner(loginBanner);
        setIsOpen(true);
        sessionStorage.removeItem('just_logged_in');
        return;
      }
      sessionStorage.removeItem('just_logged_in');
    }

    // 2) Automatic display (page_load) — show to anyone visiting
    const autoBanner = banners.find(
      (b) => b.triggerType === 'page_load' && isPopupVisible(b),
    );
    if (autoBanner) {
      // Tiny delay so it doesn't feel jarring on initial paint
      const timer = setTimeout(() => {
        setCurrentBanner(autoBanner);
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [banners, isAuthenticated]);

  const handleDismiss = () => {
    if (currentBanner && currentBanner.showOnce) {
      const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
      if (!dismissedBanners.includes(currentBanner.id)) {
        dismissedBanners.push(currentBanner.id);
        localStorage.setItem('dismissed_popups', JSON.stringify(dismissedBanners));
      }
    }
    setIsOpen(false);
    setCurrentBanner(null);
  };

  const handleBannerClick = () => {
    if (currentBanner?.linkUrl) {
      const url = currentBanner.linkUrl;
      // Internal links (start with /) — open same tab; external — new tab
      if (url.startsWith('/')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
    handleDismiss();
  };

  if (!currentBanner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent
        className="p-0 overflow-hidden max-w-lg border-0 bg-transparent shadow-2xl [&>button]:hidden"
        data-testid="popup-banner-dialog"
      >
        <DialogTitle className="sr-only">{currentBanner.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {currentBanner.linkUrl ? 'Promotional banner — tap to open' : 'Promotional banner'}
        </DialogDescription>

        <div className="relative bg-white rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 z-10 bg-white/90 hover:bg-white rounded-full w-9 h-9 p-0 shadow-md"
            onClick={handleDismiss}
            aria-label="Close banner"
            data-testid="button-close-popup"
          >
            <X className="h-5 w-5" />
          </Button>

          {currentBanner.imageUrl ? (
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className={`w-full h-auto block ${currentBanner.linkUrl ? 'cursor-pointer' : ''}`}
              onClick={currentBanner.linkUrl ? handleBannerClick : undefined}
              data-testid="img-popup-banner"
            />
          ) : (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-navy mb-4">{currentBanner.title}</h2>
              {currentBanner.linkUrl && (
                <Button onClick={handleBannerClick} data-testid="button-popup-link">
                  Learn More
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
