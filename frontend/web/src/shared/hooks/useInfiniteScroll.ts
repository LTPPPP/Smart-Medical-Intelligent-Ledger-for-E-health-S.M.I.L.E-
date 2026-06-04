// ============================================================
// useInfiniteScroll — trigger load-more when sentinel is visible
// ============================================================

"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  /** Callback when the sentinel becomes visible */
  onLoadMore: () => void;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** IntersectionObserver root margin */
  rootMargin?: string;
  /** Threshold for intersection */
  threshold?: number;
}

/**
 * Returns a ref to attach to a sentinel element.
 * Calls `onLoadMore` when the sentinel enters the viewport.
 *
 * @example
 * const sentinelRef = useInfiniteScroll({ onLoadMore, hasMore, isLoading });
 * return <div ref={sentinelRef} />;
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  rootMargin = "200px",
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, rootMargin, threshold]);

  return sentinelRef;
}
