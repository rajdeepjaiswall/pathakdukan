/**
 * Performance optimization utilities
 */

// Image format detection and optimization
export function getOptimalImageFormat(): 'webp' | 'avif' | 'jpeg' {
  // Check for AVIF support (most modern)
  if (typeof Image !== 'undefined') {
    const avif = new Image();
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    if (avif.complete && avif.naturalWidth > 0) {
      return 'avif';
    }
  }

  // Check for WebP support
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx && canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
      return 'webp';
    }
  }

  return 'jpeg';
}

// Lazy loading intersection observer
export function createLazyObserver(callback: (entries: IntersectionObserverEntry[]) => void) {
  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px', // Start loading 50px before entering viewport
    threshold: 0.1
  });
}

// Image preloading with priority
export function preloadCriticalImages(urls: string[]) {
  urls.forEach((url, index) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    if (index < 3) link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  });
}

// Connection speed detection
export function getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'medium';
  
  const { effectiveType, downlink } = connection;
  
  if (effectiveType === '4g' && downlink > 10) return 'fast';
  if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1.5)) return 'medium';
  return 'slow';
}

// Progressive image loading based on connection
export function getImageQuality(connectionSpeed: 'slow' | 'medium' | 'fast'): number {
  switch (connectionSpeed) {
    case 'fast': return 90;
    case 'medium': return 80;
    case 'slow': return 60;
    default: return 80;
  }
}

// Optimize image URL with parameters
export function optimizeImageUrl(url: string, width?: number, quality?: number): string {
  if (!url || url.startsWith('data:')) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Unsplash optimization
    if (urlObj.hostname.includes('unsplash.com')) {
      if (width) urlObj.searchParams.set('w', width.toString());
      if (quality) urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    }
    
    // Add general optimization parameters for other services
    if (width) urlObj.searchParams.set('width', width.toString());
    if (quality) urlObj.searchParams.set('quality', quality.toString());
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Performance monitoring
export class ImagePerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  
  startTiming(url: string) {
    this.metrics.set(url, performance.now());
  }
  
  endTiming(url: string): number {
    const start = this.metrics.get(url);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.metrics.delete(url);
    return duration;
  }
  
  getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values());
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
}

export const imageMonitor = new ImagePerformanceMonitor();