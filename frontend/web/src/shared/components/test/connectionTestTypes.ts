export interface TestResult {
  name: string;
  status: "idle" | "running" | "success" | "error";
  responseTime?: number;
  message?: string;
  data?: Record<string, unknown>;
}

export interface StressTestResult {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
}
