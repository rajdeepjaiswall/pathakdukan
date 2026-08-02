/**
 * Image Cache Manager for faster loading
 */

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 50 * 1024 * 1024; // 50MB cache limit
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours

  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(url);
      return null;
    }
    
    return URL.createObjectURL(entry.blob);
  }

  async set(url: string, blob: Blob): Promise<void> {
    // Clean cache if needed
    this.cleanup();
    
    const entry: CacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size
    };
    
    this.cache.set(url, entry);
  }

  private cleanup(): void {
    const entries = Array.from(this.cache.entries());
    const totalSize = entries.reduce((sum, [, entry]) => sum + entry.size, 0);
    
    if (totalSize > this.maxSize) {
      // Remove oldest entries first
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(entries.length / 2))
        .forEach(([key]) => this.cache.delete(key));
    }
    
    // Remove expired entries
    const now = Date.now();
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      count: entries.length,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp))
    };
  }
}

export const imageCache = new ImageCache();

/**
 * Preload critical images
 */
export async function preloadImage(url: string): Promise<void> {
  // Check cache first
  const cachedUrl = await imageCache.get(url);
  if (cachedUrl) return;

  // Skip fetch-based preload for external CDN URLs — CORS may not be enabled.
  // Let the browser load them naturally via <img> tags (no-cors mode).
  if (url.startsWith('https://') && !url.includes('unsplash.com')) {
    return Promise.resolve();
  }

  try {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      await imageCache.set(url, blob);
    }
  } catch (error) {
    console.warn('Failed to preload image:', url, error);
  }
}

/**
 * Preload multiple images with priority
 */
export async function preloadImages(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
  const loadPromises = urls.map(url => preloadImage(url));
  
  if (priority === 'high') {
    // Load all immediately
    await Promise.all(loadPromises);
  } else {
    // Load with delay to not block main thread
    for (const promise of loadPromises) {
      await promise;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}