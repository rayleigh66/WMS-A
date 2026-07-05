import { api } from './client';
import type { User } from '../types/api';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  me: () => api.get<User>('/auth/me'),
};
