import { api } from './client';
import type { StockOutOrder, PaginatedResponse } from '../types/api';

export const stockOutApi = {
  list: (page?: string, pageSize?: string) =>
    api.get<PaginatedResponse<StockOutOrder>>('/stock-out', { page, pageSize }),

  get: (id: string) => api.get<StockOutOrder>(`/stock-out/${id}`),

  create: (data: {
    type: string; warehouseId: string; remark?: string;
    items: { itemId: string; locationId: string; quantity: number; unit: string; remark?: string }[];
  }) => api.post<StockOutOrder>('/stock-out', data),
};
