// Infinite Scroll

"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
	/** On Load More */
	onLoadMore: () => void;
	/** Has More */
	hasMore: boolean;
	/** Is Loading */
	isLoading: boolean;
	/** Root Margin */
	rootMargin?: string;
	/** Intersection Threshold */
	threshold?: number;
}

// Sentinel Ref
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
