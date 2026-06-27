import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import type { RevenueQueryParams, RevenueReport } from '../types/revenue.type';

export const revenueApi = {
  getRevenue: (params: RevenueQueryParams) =>
    apiClient.get<RevenueReport>(API_ENDPOINTS.REPORTS.REVENUE, { params }),
};
