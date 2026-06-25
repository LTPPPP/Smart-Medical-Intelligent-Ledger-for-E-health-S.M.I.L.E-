export interface RevenueQueryParams {
  date_from: string;
  date_to: string;
  clinic_id?: string;
  group_by?: 'day' | 'service' | 'clinic';
}

export interface RevenuePeriod {
  date_from: string;
  date_to: string;
}

export interface RevenueTotals {
  total_revenue: number;
  paid_count: number;
  currency: string;
  period: RevenuePeriod;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  count: number;
}

export interface RevenueByService {
  service_id: string | null;
  service_name: string;
  revenue: number;
  count: number;
}

export interface RevenueByClinic {
  clinic_id: string | null;
  clinic_name: string;
  revenue: number;
  count: number;
}

export interface RevenueReport {
  group_by: 'day' | 'service' | 'clinic';
  totals: RevenueTotals;
  by_day: RevenueByDay[];
  by_service: RevenueByService[];
  by_clinic: RevenueByClinic[];
}
