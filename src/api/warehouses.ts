import { api } from './client';
import type { Warehouse } from '../types/api';

export const warehousesApi = {
  list: () => api.get<Warehouse[]>('/warehouses'),
  get: (id: string) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data),
  update: (id: string, data: Partial<Warehouse>) => api.patch<Warehouse>(`/warehouses/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/warehouses/${id}`),
};
