"use client";

import { useCallback, useState } from "react";

import { api } from "@/lib/api";

import type {
  StressTestResult,
  TestResult,
} from "@/components/test/connectionTestTypes";

const INITIAL_HEALTH: TestResult = { name: "Health Check", status: "idle" };
const INITIAL_PATIENTS: TestResult = { name: "Load Patients", status: "idle" };
const INITIAL_APPOINTMENTS: TestResult = {
  name: "Load Appointments",
  status: "idle",
};
const INITIAL_STRESS: TestResult = { name: "Stress Test", status: "idle" };

export function useConnectionTests() {
  const [healthCheck, setHealthCheck] = useState<TestResult>(INITIAL_HEALTH);
  const [loadPatients, setLoadPatients] =
    useState<TestResult>(INITIAL_PATIENTS);
  const [loadAppointments, setLoadAppointments] =
    useState<TestResult>(INITIAL_APPOINTMENTS);
  const [stressTest, setStressTest] = useState<TestResult>(INITIAL_STRESS);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(
    null,
  );
  const [stressProgress, setStressProgress] = useState(0);

  const runHealthCheck = useCallback(async () => {
    setHealthCheck({ name: "Health Check", status: "running" });
    const start = performance.now();
    try {
      const response = await api.get("/health");
      const duration = performance.now() - start;
      setHealthCheck({
        name: "Health Check",
        status: "success",
        responseTime: duration,
        message: "API Gateway is healthy",
        data: response.data,
      });
    } catch (error) {
      const duration = performance.now() - start;
      setHealthCheck({
        name: "Health Check",
        status: "error",
        responseTime: duration,
        message: error instanceof Error ? error.message : "Connection failed",
      });
    }
  }, []);

  const runLoadPatients = useCallback(async () => {
    setLoadPatients({ name: "Load Patients", status: "running" });
    const start = performance.now();
    try {
      const response = await api.get("/api/v1/patients", {
        params: { page: 1, limit: 20 },
      });
      const duration = performance.now() - start;
      const count = Array.isArray(response.data?.data)
        ? response.data.data.length
        : 0;
      setLoadPatients({
        name: "Load Patients",
        status: "success",
        responseTime: duration,
        message: `Loaded ${count} patients`,
        data: response.data,
      });
    } catch (error) {
      const duration = performance.now() - start;
      setLoadPatients({
        name: "Load Patients",
        status: "error",
        responseTime: duration,
        message:
          error instanceof Error ? error.message : "Failed to load patients",
      });
    }
  }, []);

  const runLoadAppointments = useCallback(async () => {
    setLoadAppointments({ name: "Load Appointments", status: "running" });
    const start = performance.now();
    try {
      const response = await api.get("/api/v1/appointments", {
        params: { page: 1, limit: 20 },
      });
      const duration = performance.now() - start;
      const count = Array.isArray(response.data?.data)
        ? response.data.data.length
        : 0;
      setLoadAppointments({
        name: "Load Appointments",
        status: "success",
        responseTime: duration,
        message: `Loaded ${count} appointments`,
        data: response.data,
      });
    } catch (error) {
      const duration = performance.now() - start;
      setLoadAppointments({
        name: "Load Appointments",
        status: "error",
        responseTime: duration,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load appointments",
      });
    }
  }, []);

  const runStressTest = useCallback(async () => {
    setStressTest({ name: "Stress Test", status: "running" });
    setStressResult(null);
    setStressProgress(0);

    const totalRequests = 50;
    const times: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < totalRequests; i++) {
      const start = performance.now();
      try {
        await api.get("/health");
        times.push(performance.now() - start);
        successCount++;
      } catch {
        times.push(performance.now() - start);
        errorCount++;
      }
      setStressProgress(((i + 1) / totalRequests) * 100);
    }

    const sorted = [...times].sort((a, b) => a - b);
    const result: StressTestResult = {
      totalRequests,
      successCount,
      errorCount,
      avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
      minResponseTime: sorted[0] ?? 0,
      maxResponseTime: sorted[sorted.length - 1] ?? 0,
      p95ResponseTime: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    };

    setStressResult(result);
    setStressTest({
      name: "Stress Test",
      status: errorCount === 0 ? "success" : "error",
      responseTime: result.avgResponseTime,
      message: `${successCount}/${totalRequests} succeeded (avg ${result.avgResponseTime.toFixed(0)}ms)`,
    });
  }, []);

  const runAllTests = useCallback(async () => {
    await runHealthCheck();
    await runLoadPatients();
    await runLoadAppointments();
    await runStressTest();
  }, [runHealthCheck, runLoadPatients, runLoadAppointments, runStressTest]);

  return {
    healthCheck,
    loadPatients,
    loadAppointments,
    stressTest,
    stressResult,
    stressProgress,
    runHealthCheck,
    runLoadPatients,
    runLoadAppointments,
    runStressTest,
    runAllTests,
  };
}
