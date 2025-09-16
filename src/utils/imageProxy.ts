/**
 * Image Proxy Utility
 * 
 * This utility helps mitigate third-party cookie issues from external image sources
 * like Pexels, Unsplash, etc. by providing a proxy solution or alternative approaches.
 */

export interface ImageProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
  auto?: boolean;
}

/**
 * Configuration for different image sources
 */
const IMAGE_SOURCE_CONFIGS = {
  pexels: {
    baseUrl: 'https://images.pexels.com',
    allowedParams: ['auto', 'compress', 'cs', 'fit', 'h', 'w', 'sharp'],
    cookielessUrl: (url: string, options: ImageProxyOptions = {}) => {
      try {
        const urlObj = new URL(url);
        
        // Remove cookie-related parameters
        const paramsToRemove = ['__cf_bm', '_cfuvid', 'fbclid', 'gclid'];
        paramsToRemove.forEach(param => {
          urlObj.searchParams.delete(param);
        });

        // Add optimization parameters
        if (options.width) urlObj.searchParams.set('w', options.width.toString());
        if (options.height) urlObj.searchParams.set('h', options.height.toString());
        if (options.fit) urlObj.searchParams.set('fit', options.fit);
        if (options.auto !== false) urlObj.searchParams.set('auto', 'compress');

        return urlObj.toString();
      } catch (error) {
        console.warn('Failed to process Pexels URL:', url, error);
        return url;
      }
    }
  },
  unsplash: {
    baseUrl: 'https://images.unsplash.com',
    allowedParams: ['auto', 'crop', 'fit', 'fm', 'h', 'q', 'w', 'ixid', 'ixlib'],
    cookielessUrl: (url: string, options: ImageProxyOptions = {}) => {
      try {
        const urlObj = new URL(url);
        
        // Remove tracking parameters
        const paramsToRemove = ['ixid', 'ixlib', 'fbclid', 'gclid'];
        paramsToRemove.forEach(param => {
          urlObj.searchParams.delete(param);
        });

        // Add optimization parameters
        if (options.width) urlObj.searchParams.set('w', options.width.toString());
        if (options.height) urlObj.searchParams.set('h', options.height.toString());
        if (options.quality) urlObj.searchParams.set('q', options.quality.toString());
        if (options.format) urlObj.searchParams.set('fm', options.format);
        if (options.fit) urlObj.searchParams.set('fit', options.fit);
        if (options.auto !== false) urlObj.searchParams.set('auto', 'format');

        return urlObj.toString();
      } catch (error) {
        console.warn('Failed to process Unsplash URL:', url, error);
        return url;
      }
    }
  },
  cloudinary: {
    baseUrl: '',
    cookielessUrl: (url: string, options: ImageProxyOptions = {}) => {
      // Cloudinary URLs are already optimized and cookie-free
      return url;
    }
  },
  direct: {
    baseUrl: '',
    cookielessUrl: (url: string, options: ImageProxyOptions = {}) => {
      // For direct URLs, return as-is or add basic optimization if supported
      return url;
    }
  }
};

/**
 * Detects the image source from a URL
 */
export function detectImageSource(url: string): keyof typeof IMAGE_SOURCE_CONFIGS {
  if (url.includes('images.pexels.com')) return 'pexels';
  if (url.includes('images.unsplash.com')) return 'unsplash';
  if (url.includes('cloudinary.com')) return 'cloudinary';
  return 'direct';
}

/**
 * Creates a cookieless version of an image URL
 */
export function createCookielessImageUrl(
  url: string, 
  options: ImageProxyOptions = {}
): string {
  const source = detectImageSource(url);
  const config = IMAGE_SOURCE_CONFIGS[source];
  
  return config.cookielessUrl(url, options);
}

/**
 * Creates a fallback image URL in case the original fails to load
 */
export function createFallbackImageUrl(originalUrl: string): string {
  const source = detectImageSource(originalUrl);
  
  // For Pexels images, try a different format or size
  if (source === 'pexels') {
    try {
      const urlObj = new URL(originalUrl);
      // Remove all parameters and add basic ones
      urlObj.search = '';
      urlObj.searchParams.set('auto', 'compress');
      urlObj.searchParams.set('cs', 'tinysrgb');
      return urlObj.toString();
    } catch {
      return originalUrl;
    }
  }
  
  // For other sources, return the original URL
  return originalUrl;
}

/**
 * Preloads an image to check if it loads successfully
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Gets the best available image URL with fallback
 */
export async function getOptimalImageUrl(
  originalUrl: string, 
  options: ImageProxyOptions = {}
): Promise<string> {
  // First try the cookieless version
  const cookielessUrl = createCookielessImageUrl(originalUrl, options);
  
  // Check if the cookieless URL loads
  const cookielessLoads = await preloadImage(cookielessUrl);
  if (cookielessLoads) {
    return cookielessUrl;
  }
  
  // If cookieless fails, try fallback
  const fallbackUrl = createFallbackImageUrl(originalUrl);
  const fallbackLoads = await preloadImage(fallbackUrl);
  if (fallbackLoads) {
    return fallbackUrl;
  }
  
  // If everything fails, return original
  return originalUrl;
}

/**
 * React hook for using optimized images
 */
export function useOptimizedImage(originalUrl: string, options: ImageProxyOptions = {}) {
  const [optimizedUrl, setOptimizedUrl] = useState(originalUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const optimizeImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const optimalUrl = await getOptimalImageUrl(originalUrl, options);
        
        if (isMounted) {
          setOptimizedUrl(optimalUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
          setOptimizedUrl(originalUrl); // Fallback to original
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    optimizeImage();

    return () => {
      isMounted = false;
    };
  }, [originalUrl, JSON.stringify(options)]);

  return { url: optimizedUrl, isLoading, error };
}

// Import React for the hook
import { useState, useEffect } from 'react';
