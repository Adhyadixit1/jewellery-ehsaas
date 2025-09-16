import React, { useState, useEffect } from 'react';
import { createCookielessImageUrl, createFallbackImageUrl, detectImageSource, useOptimizedImage } from '../utils/imageProxy';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  onError?: () => void;
  onLoad?: () => void;
  placeholder?: string;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

/**
 * OptimizedImage Component
 * 
 * A React component that handles image optimization and third-party cookie mitigation
 * for external image sources like Pexels, Unsplash, etc.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  onError,
  onLoad,
  placeholder = '/placeholder.svg',
  quality = 80,
  format = 'webp',
  fit = 'cover',
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSource, setImageSource] = useState<string>('direct');

  // Initialize with cookieless URL
  useEffect(() => {
    try {
      const source = detectImageSource(src);
      setImageSource(source);
      
      const cookielessUrl = createCookielessImageUrl(src, {
        width,
        height,
        quality,
        format,
        fit,
      });
      
      setCurrentSrc(cookielessUrl);
    } catch (error) {
      console.warn('Failed to create cookieless image URL:', error);
      setCurrentSrc(src);
    }
  }, [src, width, height, quality, format, fit]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      
      // Try fallback URL
      try {
        const fallbackUrl = createFallbackImageUrl(src);
        if (fallbackUrl !== currentSrc) {
          setCurrentSrc(fallbackUrl);
          return;
        }
      } catch (error) {
        console.warn('Failed to create fallback image URL:', error);
      }
      
      // If fallback fails, use placeholder
      setCurrentSrc(placeholder);
      onError?.();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (imageSource === 'direct' || !width) return undefined;
    
    const sizes = [0.5, 0.75, 1, 1.5, 2];
    return sizes
      .map(scale => {
        const scaledWidth = Math.round(width * scale);
        const scaledHeight = height ? Math.round(height * scale) : undefined;
        
        try {
          const url = createCookielessImageUrl(src, {
            width: scaledWidth,
            height: scaledHeight,
            quality,
            format,
            fit,
          });
          return `${url} ${scale}x`;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .join(', ');
  };

  // Generate sizes attribute
  const generateSizes = () => {
    if (!width) return undefined;
    return `(max-width: 768px) ${Math.round(width * 0.8)}px, ${width}px`;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Main image */}
      <img
        src={currentSrc}
        srcSet={generateSrcSet()}
        sizes={generateSizes()}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-${fit} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundColor: hasError ? '#f3f4f6' : 'transparent',
        }}
      />

      {/* Error overlay */}
      {hasError && currentSrc === placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-gray-600">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Image source badge (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {imageSource}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
