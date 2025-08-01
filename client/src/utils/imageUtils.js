/**
 * Utility functions for handling image paths
 */

export const getProductImage = (imagePath) => {
  if (!imagePath) return '/images/placeholder-product.jpg';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a path starting with /images, return as is
  if (imagePath.startsWith('/images/')) {
    return imagePath;
  }
  
  // For product IDs, use F1-F10.jpg based on product ID
  if (typeof imagePath === 'number' || (typeof imagePath === 'string' && /^\d+$/.test(imagePath))) {
    const id = parseInt(imagePath, 10);
    const imageNumber = ((id - 1) % 10) + 1; // Cycle through 1-10
    return `/images/F${imageNumber}.jpg`;
  }
  
  // If it's a string that looks like a filename, use it as is
  if (typeof imagePath === 'string' && imagePath.includes('.')) {
    return `/images/${imagePath}`;
  }
  
  // Default fallback
  return '/images/placeholder-product.jpg';
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
  } 
  // Handle array
  else if (Array.isArray(product.image_url)) {
    urls = product.image_url;
  }
  
  // Process each URL
  return urls.map(url => getProductImage(url));
};
