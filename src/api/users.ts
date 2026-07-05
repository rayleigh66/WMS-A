import { api } from './client';
import type { User, PaginatedResponse } from '../types/api';

export const usersApi = {
  list: (params?: { page?: string; pageSize?: string; search?: string; role?: string; status?: string }) =>
    api.get<PaginatedResponse<User>>('/users', params as Record<string, string | undefined>),

  get: (id: string) => api.get<User>(`/users/${id}`),

  create: (data: { email: string; password: string; name: string; role: string; department?: string }) =>
    api.post<User>('/users', data),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    api.patch<User>(`/users/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/users/${id}`),
};
