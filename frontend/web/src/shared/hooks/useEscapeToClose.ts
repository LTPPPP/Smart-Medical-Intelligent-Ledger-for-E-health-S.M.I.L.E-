// Escape To Close

"use client";

import { useEffect } from "react";

// Escape Handler
export function useEscapeToClose(onClose: () => void) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);
}
