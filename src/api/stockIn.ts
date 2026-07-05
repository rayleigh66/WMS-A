import { api } from './client';
import type { StockInOrder, PaginatedResponse } from '../types/api';

export const stockInApi = {
  list: (page?: string, pageSize?: string) =>
    api.get<PaginatedResponse<StockInOrder>>('/stock-in', { page, pageSize }),

  get: (id: string) => api.get<StockInOrder>(`/stock-in/${id}`),

  create: (data: {
    type: string; warehouseId: string; remark?: string;
    items: { itemId: string; locationId: string; quantity: number; unit: string; remark?: string }[];
  }) => api.post<StockInOrder>('/stock-in', data),
};
