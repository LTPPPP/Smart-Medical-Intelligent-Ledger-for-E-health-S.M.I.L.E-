"use client";

import { createContext, useContext } from "react";

import type { PublicConfig } from "@/shared/config/public";

const PublicConfigContext = createContext<PublicConfig | null>(null);

interface PublicConfigProviderProps {
	children: React.ReactNode;
	config: PublicConfig;
}

export function PublicConfigProvider({
	children,
	config,
}: PublicConfigProviderProps) {
	return (
		<PublicConfigContext.Provider value={config}>
			{children}
		</PublicConfigContext.Provider>
	);
}

export function usePublicConfig(): PublicConfig {
	const config = useContext(PublicConfigContext);
	if (!config) {
		throw new Error(
			"usePublicConfig must be used within a PublicConfigProvider.",
		);
	}

	return config;
}
