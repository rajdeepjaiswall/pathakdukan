import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Small delay before showing to avoid flicker for fast loads
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const logoSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (!isVisible) return null;

  // iOS-specific branded loading animation
  if (isIOS) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="flex flex-col items-center">
          {/* Enhanced iOS loading with company branding */}
          <div className="relative">
            {/* Outer rotating ring with company colors */}
            <div className={`${sizeClasses[size]} animate-spin`} style={{ animationDuration: '2s' }}>
              <div className="h-full w-full rounded-full border-4 border-champagne/30 border-t-navy border-r-navy/70"></div>
            </div>
            
            {/* Inner pulsing ring */}
            <div className={`absolute inset-2 animate-pulse`}>
              <div className="h-full w-full rounded-full border-2 border-almond/50"></div>
            </div>
            
            {/* Company logo in center with special iOS animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/api/logo" 
                alt="Pathak Bhandar"
                className={`object-contain ${logoSizeClasses[size]} animate-bounce`}
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(17%) sepia(25%) saturate(1315%) hue-rotate(195deg) brightness(94%) contrast(96%)',
                  animationDuration: '1.5s'
                }}
              />
            </div>
            
            {/* iOS-style shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* iOS-style loading text */}
          <p className="mt-4 text-base text-navy font-medium animate-pulse">Pathak Bhandar</p>
          <p className="mt-1 text-sm text-navy/60">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Mobile-only centered loading */}
      <div className="md:hidden flex flex-col items-center">
        <div className="relative">
          {/* Rotating ring */}
          <div className={`${sizeClasses[size]} animate-spin`}>
            <div className="h-full w-full rounded-full border-4 border-almond border-t-navy"></div>
          </div>
          
          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/api/logo" 
              alt="Pathak Bhandar"
              className={`object-contain animate-pulse ${logoSizeClasses[size]}`}
              style={{ 
                filter: 'brightness(0) saturate(100%) invert(17%) sepia(25%) saturate(1315%) hue-rotate(195deg) brightness(94%) contrast(96%)' 
              }}
            />
          </div>
        </div>
        
        {/* Loading text */}
        <p className="mt-3 text-sm text-navy/70 animate-pulse">Loading...</p>
      </div>

      {/* Desktop loading (simple spinner) */}
      <div className="hidden md:flex items-center space-x-2">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="h-full w-full rounded-full border-4 border-almond border-t-navy"></div>
        </div>
        <span className="text-navy/70">Loading...</span>
      </div>
    </div>
  );
}