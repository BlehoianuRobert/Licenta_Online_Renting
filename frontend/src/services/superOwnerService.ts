import api from './api';
import { SuperOwnerStatistics } from '../types';

export const superOwnerService = {
  getStatistics: async (): Promise<SuperOwnerStatistics> => {
    const response = await api.get<SuperOwnerStatistics>('/superowner/statistics');
    return response.data;
  },
};
