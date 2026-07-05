import { api } from './client';
import type { OperationLog, PaginatedResponse } from '../types/api';

export const operationLogsApi = {
  list: (params?: { page?: string; pageSize?: string; action?: string; entityType?: string }) =>
    api.get<PaginatedResponse<OperationLog>>('/operation-logs', params as Record<string, string | undefined>),
};
