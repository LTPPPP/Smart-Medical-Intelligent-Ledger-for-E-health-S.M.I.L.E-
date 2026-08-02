// Media Query

"use client";

import { useEffect, useState } from "react";

// Media Query Match
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
