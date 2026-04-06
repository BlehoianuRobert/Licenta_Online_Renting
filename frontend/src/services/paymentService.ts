import api from './api';
import { PaymentIntentRequest, PaymentIntentResponse, ApiResponse } from '../types';

export const paymentService = {
  createPaymentIntent: async (request: PaymentIntentRequest): Promise<PaymentIntentResponse> => {
    const response = await api.post<PaymentIntentResponse>('/payments/create-intent', request);
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(`/payments/confirm/${paymentIntentId}`);
    return response.data;
  },
};
