import { api } from './client';
import type { StockMovement, PaginatedResponse } from '../types/api';

export const movementsApi = {
  list: (params?: {
    page?: string; pageSize?: string; itemId?: string; warehouseId?: string;
    locationId?: string; movementType?: string; sourceType?: string;
    dateFrom?: string; dateTo?: string;
  }) => api.get<PaginatedResponse<StockMovement>>('/stock-movements', params as Record<string, string | undefined>),

  get: (id: string) => api.get<StockMovement>(`/stock-movements/${id}`),
};
