"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export type UiScale = "sm" | "md" | "lg";

export const UI_SCALES: { value: UiScale; label: string; hint: string }[] = [
	{ value: "sm", label: "Nhỏ", hint: "Mặc định" },
	{ value: "md", label: "Vừa", hint: "To hơn 25%" },
	{ value: "lg", label: "Lớn", hint: "To hơn 50%" },
];

const STORAGE_KEY = "smile-ui-scale";
const DEFAULT_SCALE: UiScale = "sm";

const isUiScale = (v: unknown): v is UiScale =>
	v === "sm" || v === "md" || v === "lg";

interface ScaleContextValue {
	scale: UiScale;
	setScale: (scale: UiScale) => void;
}

const ScaleContext = createContext<ScaleContextValue>({
	scale: DEFAULT_SCALE,
	setScale: () => {},
});

/**
 * Applies the user's UI scale to <html data-ui-scale>, which the root
 * font-size rules in globals.css key off. Everything sized in rem follows.
 */
export function ScaleProvider({ children }: { children: React.ReactNode }) {
	const [scale, setScaleState] = useState<UiScale>(DEFAULT_SCALE);

	useEffect(() => {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (isUiScale(stored)) {
			setScaleState(stored);
			document.documentElement.dataset.uiScale = stored;
		} else {
			document.documentElement.dataset.uiScale = DEFAULT_SCALE;
		}
	}, []);

	const setScale = useCallback((next: UiScale) => {
		setScaleState(next);
		document.documentElement.dataset.uiScale = next;
		window.localStorage.setItem(STORAGE_KEY, next);
	}, []);

	return (
		<ScaleContext.Provider value={{ scale, setScale }}>
			{children}
		</ScaleContext.Provider>
	);
}

export const useUiScale = () => useContext(ScaleContext);
