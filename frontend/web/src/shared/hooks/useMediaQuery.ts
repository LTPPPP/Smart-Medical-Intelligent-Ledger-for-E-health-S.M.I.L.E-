// ============================================================
// useMediaQuery hook — responsive breakpoint detection
// ============================================================

"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query and reactively return whether it matches.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);
		setMatches(media.matches);

		function onChange(e: MediaQueryListEvent) {
			setMatches(e.matches);
		}

		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
