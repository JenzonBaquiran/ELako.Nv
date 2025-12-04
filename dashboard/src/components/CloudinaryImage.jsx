import React, { useState } from 'react';
import { getOptimizedImageUrl, isCloudinaryUrl } from '../utils/cloudinary';

const CloudinaryImage = ({ 
  src, 
  alt = '', 
  width, 
  height, 
  className = '', 
  style = {}, 
  fallbackSrc = '/placeholder-image.jpg',
  loading = 'lazy',
  onClick,
  transformations = {},
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle image load error
  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Get the appropriate image URL
  const getImageUrl = () => {
    if (imageError) return fallbackSrc;
    if (!src) return fallbackSrc;
    
    // For local images (backward compatibility)
    if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
      return `http://localhost:1337/${src.startsWith('/') ? src.slice(1) : src}`;
    }
    
    // For full URLs (including Cloudinary), return as-is
    if (src.startsWith('http')) {
      return src;
    }
    
    // If it's a Cloudinary public ID, generate URL
    if (isCloudinaryUrl(src)) {
      return getOptimizedImageUrl(src, { width, height, ...transformations });
    }
    
    // Assume it's a local file if none of the above
    return `http://localhost:1337/uploads/${src}`;
  };

  return (
    <div className={`cloudinary-image-container ${className}`} style={style}>
      {isLoading && (
        <div className="image-loading-placeholder" style={{
          width: width || '100%',
          height: height || '200px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999'
        }}>
          Loading...
        </div>
      )}
      <img
        src={getImageUrl()}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        style={{
          display: isLoading ? 'none' : 'block',
          maxWidth: '100%',
          height: 'auto'
        }}
        {...props}
      />
    </div>
  );
};

export default CloudinaryImage;