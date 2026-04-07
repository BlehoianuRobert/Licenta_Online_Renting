/**
 * Base URL for /images/**. Empty string = same origin (nginx on :3000 or Vite dev server with proxy).
 */
function imageOriginBase(): string {
  const api = import.meta.env.VITE_API_URL as string | undefined;
  if (!api) {
    return 'http://localhost:8081';
  }
  if (api.startsWith('/')) {
    return '';
  }
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return api.replace(/\/api\/v1\/?$/, '');
  }
  return 'http://localhost:8081';
}

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

  const base = imageOriginBase();

  // If it's a local path (starts with /images/), convert to full URL
  if (imageUrl.startsWith('/images/')) {
    return base + imageUrl;
  }

  // If it's just a filename, assume it's in /images/
  if (!imageUrl.includes('/') && !imageUrl.includes(':')) {
    return `${base}/images/${imageUrl}`;
  }

  // Return as is for any other format
  return imageUrl;
};
