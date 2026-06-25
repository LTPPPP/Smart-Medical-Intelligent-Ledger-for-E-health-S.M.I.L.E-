'use client';

import { useQuery } from '@tanstack/react-query';
import { revenueApi } from '../api/revenue.api';
import type { RevenueQueryParams } from '../types/revenue.type';

export function useRevenue(params: RevenueQueryParams) {
  return useQuery({
    queryKey: ['revenue', 'report', params],
    queryFn: () => revenueApi.getRevenue(params),
    enabled: !!params.date_from && !!params.date_to,
  });
}
