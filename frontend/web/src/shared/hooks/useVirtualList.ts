// Virtual List

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseVirtualListOptions {
	/** Item Count */
	itemCount: number;
	/** Item Height */
	itemHeight: number;
	/** Overscan Count */
	overscan?: number;
}

interface VirtualItem {
	index: number;
	offsetTop: number;
}

interface UseVirtualListReturn {
	/** Container Ref */
	containerRef: React.RefObject<HTMLDivElement | null>;
	/** Virtual Items */
	virtualItems: VirtualItem[];
	/** Total Height */
	totalHeight: number;
	/** Scroll To Index */
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

	// Measure Container Height
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

	// Track Scroll Position
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
