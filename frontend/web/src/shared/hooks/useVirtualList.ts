// ============================================================
// useVirtualList — lightweight virtualization for large lists
// renders only visible items + overscan buffer
// ============================================================

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseVirtualListOptions {
	/** Total number of items */
	itemCount: number;
	/** Height of each item in pixels */
	itemHeight: number;
	/** Number of items to render above/below the visible area */
	overscan?: number;
}

interface VirtualItem {
	index: number;
	offsetTop: number;
}

interface UseVirtualListReturn {
	/** Ref to attach to the scroll container */
	containerRef: React.RefObject<HTMLDivElement | null>;
	/** Items currently visible (with overscan) */
	virtualItems: VirtualItem[];
	/** Total height of the list for scrollbar sizing */
	totalHeight: number;
	/** Scroll to a specific item index */
	scrollToIndex: (index: number) => void;
}

export function useVirtualList({
	itemCount,
	itemHeight,
	overscan = 5,
}: UseVirtualListOptions): UseVirtualListReturn {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [containerHeight, setContainerHeight] = useState(0);

	// Measure container height on mount and resize
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				setContainerHeight(entry.contentRect.height);
			}
		});

		observer.observe(container);
		setContainerHeight(container.clientHeight);

		return () => observer.disconnect();
	}, []);

	// Track scroll position
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleScroll = () => {
			setScrollTop(container.scrollTop);
		};

		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => container.removeEventListener("scroll", handleScroll);
	}, []);

	const totalHeight = itemCount * itemHeight;

	const virtualItems = useMemo(() => {
		const startIndex = Math.max(
			0,
			Math.floor(scrollTop / itemHeight) - overscan,
		);
		const endIndex = Math.min(
			itemCount - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
		);

		const items: VirtualItem[] = [];
		for (let i = startIndex; i <= endIndex; i++) {
			items.push({
				index: i,
				offsetTop: i * itemHeight,
			});
		}
		return items;
	}, [scrollTop, containerHeight, itemCount, itemHeight, overscan]);

	const scrollToIndex = useCallback(
		(index: number) => {
			containerRef.current?.scrollTo({
				top: index * itemHeight,
				behavior: "smooth",
			});
		},
		[itemHeight],
	);

	return { containerRef, virtualItems, totalHeight, scrollToIndex };
}
