import { api } from './client';
import type { InventoryItem, PaginatedResponse } from '../types/api';

export const inventoryApi = {
  list: (params?: {
    page?: string; pageSize?: string; search?: string; category?: string;
    warehouseId?: string; locationId?: string; lowStock?: string;
  }) => api.get<PaginatedResponse<InventoryItem>>('/inventory', params as Record<string, string | undefined>),

  get: (id: string) => api.get<InventoryItem>(`/inventory/${id}`),
};
