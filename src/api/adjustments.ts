import { api } from './client';
import type { StockAdjustment, PaginatedResponse } from '../types/api';

export const adjustmentsApi = {
  list: (page?: string, pageSize?: string) =>
    api.get<PaginatedResponse<StockAdjustment>>('/stock-adjustments', { page, pageSize }),

  get: (id: string) => api.get<StockAdjustment>(`/stock-adjustments/${id}`),

  create: (data: {
    warehouseId: string; reason: string; remark?: string;
    items: { itemId: string; locationId: string; quantityAfter: number; unit: string; remark?: string }[];
  }) => api.post<StockAdjustment>('/stock-adjustments', data),
};
