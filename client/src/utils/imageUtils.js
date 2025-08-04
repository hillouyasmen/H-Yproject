/**
 * Utility functions for handling image paths
 */
// src/utils/getProductImage.js

export const getProductImage = (imagePath) => {
  // Default fallback
  const PLACEHOLDER = process.env.PUBLIC_URL + '/images/placeholder-product.jpg';

  if (!imagePath) return PLACEHOLDER;

  // Full URL
  if (imagePath.startsWith('http')) return imagePath;

  // Path from /images
  if (imagePath.startsWith('/images/')) {
    return process.env.PUBLIC_URL + imagePath;
  }

  // Just the filename
  if (typeof imagePath === 'string' && imagePath.includes('.')) {
    return process.env.PUBLIC_URL + '/images/' + imagePath;
  }

  // Fallback
  return PLACEHOLDER;
};

export const getImageUrls = (product) => {
  if (!product) return [];
  let urls = [];

  // Handle string (single image or JSON array string)
  if (typeof product.image_url === 'string') {
    try {
      const parsed = JSON.parse(product.image_url);
      if (Array.isArray(parsed)) {
        urls = parsed;
      } else {
        urls = [parsed];
      }
    } catch (e) {
      urls = [product.image_url];
    }
  } else if (Array.isArray(product.image_url)) {
    urls = product.image_url;
  }

  // Process each URL with getProductImage
  return urls.map(url => getProductImage(url));
};
