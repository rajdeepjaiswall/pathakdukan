import { Home, ClipboardList, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import pathakLogo from '@assets/Screenshot_2026-04-26-21-37-03-25_96b26121e545231a3c569311a54c_1777219640927.png';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function MobileNav() {
  const [location] = useLocation();
  const { summary, openCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 10) {
      setIsVisible(true);
    } else if (currentScrollY < lastScrollY.current) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      const cartPopupActive = document.querySelector('[data-cart-popup-active="true"]');
      if (!cartPopupActive) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    }

    lastScrollY.current = currentScrollY;
    ticking.current = false;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => handleScroll());
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: ClipboardList, label: 'Orders', href: '/customer/orders' },
    { icon: 'logo', label: 'Categories', href: '/products' },
    { icon: ShoppingCart, label: 'Cart', href: '/cart' },
    { icon: User, label: 'Account', href: isAuthenticated ? '/account' : '/login' },
  ];

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openCart();
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') return location === '/';
    if (href === '/customer/orders') return location.includes('/customer/orders');
    if (href === '/products') return location === '/products' || location.startsWith('/products/category');
    if (href === '/cart') return location === '/cart';
    if (href === '/account' || href === '/login') return location === '/account' || location.startsWith('/customer/') || location === '/login';
    return location === href;
  };

  const nav = (
    <nav
      className="mobile-nav-root md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 9999,
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.2s ease-in-out',
        willChange: 'transform',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        overflow: 'visible',
        boxSizing: 'border-box',
      }}
      aria-label="Mobile navigation"
    >
      <div
        className="bg-amber-50/95 backdrop-blur-sm border-t border-amber-200"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          minHeight: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="grid grid-cols-5 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            const isCart = item.label === 'Cart';
            const isLogo = item.icon === 'logo';
            const isAccount = item.label === 'Account';

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={isCart ? handleCartClick : undefined}
                className={`flex flex-col items-center justify-center py-1 relative ${
                  isActive
                    ? 'text-amber-800 bg-amber-200/40 rounded-lg mx-1'
                    : 'text-amber-700/80 hover:text-amber-800 hover:bg-amber-200/20 rounded-lg mx-1'
                }`}
              >
                {isLogo ? (
                  <div className="relative w-full h-10 flex items-center justify-center pointer-events-none">
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 -top-10 ${isActive ? 'h-24 w-24' : 'h-20 w-20'}`}
                    >
                      <img
                        src={pathakLogo}
                        alt="Pathak Bhandar Since 1957"
                        className="w-full h-full object-contain rounded-full drop-shadow-lg animate-pulse-logo"
                      />
                    </div>
                    {isActive && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-800 rounded-full"></div>
                    )}
                  </div>
                ) : isAccount && isAuthenticated ? (
                  <>
                    <div className="relative h-6 w-6 flex items-center justify-center">
                      <Avatar className={`${isActive ? 'h-6 w-6' : 'h-5 w-5'}`}>
                        <AvatarImage src={(user as any)?.profileImageUrl} alt={(user as any)?.firstName || user?.username || 'Profile'} />
                        <AvatarFallback className="bg-amber-800 text-amber-50 text-[10px] font-semibold">
                          {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-800 rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-xs mt-1 leading-none ${isActive ? 'text-amber-800 font-medium' : 'text-amber-700/80'}`}>
                      {item.label}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="relative h-6 w-6 flex items-center justify-center">
                      <Icon className={`${isActive ? 'h-6 w-6' : 'h-5 w-5'} ${isActive ? 'text-amber-800' : 'text-amber-700/80'}`} />
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-800 rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-xs mt-1 leading-none ${isActive ? 'text-amber-800 font-medium' : 'text-amber-700/80'}`}>
                      {item.label}
                    </span>
                  </>
                )}
                {isCart && summary.itemCount > 0 && (
                  <div className="absolute -top-1 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{summary.itemCount > 9 ? '9+' : summary.itemCount}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}
