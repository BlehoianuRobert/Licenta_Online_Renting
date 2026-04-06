import api from './api';

interface FileUploadResponse {
  success: boolean;
  message: string;
  imageUrl: string | null;
}

export const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Axios will automatically set Content-Type with boundary for FormData
    const response = await api.post<FileUploadResponse>('/upload/image', formData);

    if (response.data.success && response.data.imageUrl) {
      // Return the relative path (like /images/filename.jpg)
      // The frontend will construct the full URL when displaying
      return response.data.imageUrl;
    }

    throw new Error(response.data.message || 'Eroare la încărcarea imaginii');
  },
};
