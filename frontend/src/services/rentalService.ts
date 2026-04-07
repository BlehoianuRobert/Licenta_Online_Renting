import api from './api';
import { Rental, RentalRequest, ApiResponse, ConditionCheckRequest } from '../types';

export const rentalService = {
  createRental: async (rental: RentalRequest): Promise<Rental> => {
    const response = await api.post<Rental>('/rentals', rental);
    return response.data;
  },

  getMyRentals: async (): Promise<Rental[]> => {
    const response = await api.get<Rental[]>('/rentals/my');
    return response.data;
  },

  getAllRentals: async (): Promise<Rental[]> => {
    const response = await api.get<Rental[]>('/rentals');
    return response.data;
  },

  getRentalById: async (id: number): Promise<Rental> => {
    const response = await api.get<Rental>(`/rentals/${id}`);
    return response.data;
  },

  updateRentalStatus: async (id: number, status: string): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(`/rentals/${id}/status?newStatus=${status}`);
    return response.data;
  },

  deleteRental: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/rentals/${id}`);
    return response.data;
  },

  checkItemCondition: async (id: number, request: ConditionCheckRequest): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(`/rentals/${id}/check-condition`, request);
    return response.data;
  },

  generateAwb: async (id: number): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(`/rentals/${id}/generate-awb`);
    return response.data;
  },

  uploadRentalPhotos: async (
    rentalId: number,
    phase: 'HANDOVER' | 'PRE_RETURN',
    files: File[]
  ): Promise<string[]> => {
    const formData = new FormData();
    formData.append('phase', phase);
    files.forEach((f) => formData.append('files', f));
    const response = await api.post<string[]>(`/rentals/${rentalId}/photos`, formData);
    return response.data;
  },

  /** Răspuns JSON de la serviciul AI (obiect sau text, după cum îl trimite backend-ul). */
  compareRentalPhotos: async (rentalId: number): Promise<unknown> => {
    const response = await api.post<unknown>(`/rentals/${rentalId}/compare-photos`);
    return response.data;
  },
};
