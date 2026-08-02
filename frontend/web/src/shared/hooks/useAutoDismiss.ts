// Auto Dismiss Hook

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Auto-Clearing State
export function useAutoDismiss<T>(ms = 4000) {
	const [value, setValue] = useState<T | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const setValueWithDismiss = useCallback(
		(next: T | null) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			setValue(next);
			if (next !== null) {
				timerRef.current = setTimeout(() => setValue(null), ms);
			}
		},
		[ms],
	);

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[],
	);

	return [value, setValueWithDismiss] as const;
}
