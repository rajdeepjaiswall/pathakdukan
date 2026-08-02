import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { imageCache } from '@/lib/image-cache';
import { optimizeImageUrl, getConnectionSpeed, getImageQuality, imageMonitor } from '@/lib/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    const loadTime = imageMonitor.endTiming(src);
    if (loadTime > 0) {
      console.debug(`Image loaded in ${loadTime.toFixed(2)}ms:`, src);
    }
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    imageMonitor.endTiming(src);
    setIsError(true);
    onError?.();
  };

  // Use performance utilities for optimization
  const connectionSpeed = getConnectionSpeed();
  const quality = getImageQuality(connectionSpeed);
  const optimizedSrc = optimizeImageUrl(src, width, quality);

  // Start timing when image starts loading
  useEffect(() => {
    if (isVisible && optimizedSrc) {
      imageMonitor.startTiming(src);
    }
  }, [isVisible, optimizedSrc, src]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !isError && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded"></div>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isVisible && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full object-cover'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}