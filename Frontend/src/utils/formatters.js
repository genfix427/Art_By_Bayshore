export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const truncateText = (text, length = 100) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// utils/formatters.js (frontend)
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder.jpg';
  
  // If it's already a full URL (Cloudinary), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a local path starting with /uploads/, prepend the API URL
  if (imagePath.startsWith('/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}${imagePath}`;
  }
  
  // For Cloudinary public_id (without full URL), construct URL
  if (imagePath.includes('art_haven/')) {
    // This is a Cloudinary public_id, not a full URL
    return `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${imagePath}`;
  }
  
  return imagePath || '/placeholder.jpg';
};