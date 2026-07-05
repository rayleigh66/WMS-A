import { api } from './client';
import type { Item, PaginatedResponse } from '../types/api';

export const itemsApi = {
  list: (params?: { page?: string; pageSize?: string; search?: string; category?: string; status?: string }) =>
    api.get<PaginatedResponse<Item>>('/items', params as Record<string, string | undefined>),

  get: (id: string) => api.get<Item>(`/items/${id}`),

  create: (data: Partial<Item>) => api.post<Item>('/items', data),

  update: (id: string, data: Partial<Item>) => api.patch<Item>(`/items/${id}`, data),

  remove: (id: string) => api.delete<{ message: string }>(`/items/${id}`),
};
