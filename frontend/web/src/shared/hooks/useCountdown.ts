// Countdown Hook

"use client";

import { useEffect, useState } from "react";

// Countdown Timer
export function useCountdown() {
	const [remaining, setRemaining] = useState(0);

	useEffect(() => {
		if (remaining <= 0) return;
		const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
		return () => clearTimeout(timer);
	}, [remaining]);

	return {
		remaining,
		isActive: remaining > 0,
		start: (seconds: number) => setRemaining(seconds),
	};
}
