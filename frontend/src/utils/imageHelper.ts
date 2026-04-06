/**
 * Helper function to get the full image URL
 * Supports:
 * - Full URLs (http://, https://)
 * - Base64 data URIs (data:image/...)
 * - Local paths (/images/filename.jpg) - converts to full backend URL
 */
export const getImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return '';
  }

  // If it's already a full URL or base64, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // If it's a local path (starts with /images/), convert to full URL
  if (imageUrl.startsWith('/images/')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8081';
    return baseUrl + imageUrl;
  }

  // If it's just a filename, assume it's in /images/
  if (!imageUrl.includes('/') && !imageUrl.includes(':')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8081';
    return `${baseUrl}/images/${imageUrl}`;
  }

  // Return as is for any other format
  return imageUrl;
};
