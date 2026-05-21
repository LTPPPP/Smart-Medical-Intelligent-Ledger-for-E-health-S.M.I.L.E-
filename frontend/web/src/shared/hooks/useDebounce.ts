// ============================================================
// useDebounce hook — debounce a value (search inputs, etc.)
// ============================================================

"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a value by the specified delay.
 * Commonly used for search inputs to avoid excessive API calls.
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * // Use debouncedSearch in your query
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
