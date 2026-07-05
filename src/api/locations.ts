import { api } from './client';
import type { Location } from '../types/api';

export const locationsApi = {
  list: (warehouseId?: string) =>
    api.get<Location[]>('/locations', warehouseId ? { warehouseId } : undefined),
  get: (id: string) => api.get<Location>(`/locations/${id}`),
  create: (data: Partial<Location>) => api.post<Location>('/locations', data),
  update: (id: string, data: Partial<Location>) => api.patch<Location>(`/locations/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/locations/${id}`),
};
