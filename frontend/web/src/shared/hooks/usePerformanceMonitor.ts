// ============================================================
// usePerformanceMonitor — observe Web Vitals in real-time
// ============================================================

"use client";

import { useEffect, useState } from "react";

import { getRating, type WebVitalsMetric } from "@/lib/performance";

/**
 * Observes Core Web Vitals using the web-vitals reporting API
 * built into Next.js. Also provides manual performance entries.
 *
 * @example
 * const { metrics } = usePerformanceMonitor();
 * // metrics = [{ name: "LCP", value: 1200, rating: "good" }, ...]
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([]);

  useEffect(() => {
    // Use PerformanceObserver to get paint metrics
    const observers: PerformanceObserver[] = [];

    // FCP
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            const value = entry.startTime;
            setMetrics((prev) => [
              ...prev.filter((m) => m.name !== "FCP"),
              { name: "FCP", value, rating: getRating("FCP", value) },
            ]);
          }
        }
      });
      fcpObserver.observe({ type: "paint", buffered: true });
      observers.push(fcpObserver);
    } catch {
      // PerformanceObserver not supported
    }

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const value = lastEntry.startTime;
          setMetrics((prev) => [
            ...prev.filter((m) => m.name !== "LCP"),
            { name: "LCP", value, rating: getRating("LCP", value) },
          ]);
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObserver);
    } catch {
      // Not supported
    }

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value ?? 0;
            setMetrics((prev) => [
              ...prev.filter((m) => m.name !== "CLS"),
              {
                name: "CLS",
                value: clsValue,
                rating: getRating("CLS", clsValue),
              },
            ]);
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObserver);
    } catch {
      // Not supported
    }

    // TTFB from navigation timing
    try {
      const navEntry = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        setMetrics((prev) => [
          ...prev.filter((m) => m.name !== "TTFB"),
          { name: "TTFB", value: ttfb, rating: getRating("TTFB", ttfb) },
        ]);
      }
    } catch {
      // Not supported
    }

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return { metrics };
}
