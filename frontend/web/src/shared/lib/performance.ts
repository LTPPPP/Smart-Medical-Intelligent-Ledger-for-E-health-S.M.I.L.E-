// ============================================================
// Performance utilities — lazy loading, prefetch, metrics
// ============================================================

import type { ComponentType, ReactNode } from "react";

import dynamic from "next/dynamic";

/**
 * Lazy-load a component with Next.js dynamic import
 * Includes loading state and error boundary handling
 */
export function lazyLoad<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: {
    loading?: () => ReactNode;
    ssr?: boolean;
  },
) {
  return dynamic(importFn, {
    loading: options?.loading ?? (() => null),
    ssr: options?.ssr ?? true,
  });
}

/**
 * Measure execution time of async functions
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (process.env.NODE_ENV !== "development") return fn();

  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.debug(`[perf] ${label}: ${duration.toFixed(2)}ms`);
  return result;
}

/**
 * Web Vitals types for monitoring
 */
export interface WebVitalsMetric {
  name: "FCP" | "LCP" | "CLS" | "FID" | "INP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Thresholds from Google's Web Vitals guidelines
 */
const THRESHOLDS: Record<string, [number, number]> = {
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  FID: [100, 300],
  INP: [200, 500],
  TTFB: [800, 1800],
};

export function getRating(
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const [good, poor] = THRESHOLDS[name] ?? [Infinity, Infinity];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(cb: () => void, timeout = 2000) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, 1);
  }
}

/**
 * Prefetch a route in idle time
 */
export function prefetchInIdle(url: string) {
  requestIdleCallback(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  });
}
