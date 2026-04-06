import api from './api';
import { LoginRequest, RegisterRequest, JwtResponse, ApiResponse } from '../types';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  roles: string[];
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<JwtResponse> => {
    const response = await api.post<JwtResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/register', userData);
    return response.data;
  },

  confirmEmail: async (token: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(`/auth/confirm?token=${token}`);
    return response.data;
  },

  promoteToAdmin: async (username: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(`/auth/promote-admin?username=${username}`);
    return response.data;
  },

  promoteToSuperOwner: async (username: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(`/users/${username}/promote-superowner`);
    return response.data;
  },

  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await api.get<UserResponse[]>('/users');
    return response.data;
  },
};
