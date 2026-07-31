/* eslint-disable import/order */
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Anta, Genos } from "next/font/google";
/* eslint-enable import/order */

import { getPublicConfig } from "@/shared/config/public.server";

import { Providers } from "./provider/Providers";
import { PublicConfigProvider } from "./provider/PublicConfigProvider";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
});

const anta = Anta({
	variable: "--font-anta",
	subsets: ["latin"],
	weight: ["400"],
	display: "swap",
});

const genos = Genos({
	variable: "--font-genos",
	subsets: ["latin", "vietnamese"],
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "S.M.I.L.E — Smart Medical Intelligent Ledger for E-health",
		template: "%s | S.M.I.L.E",
	},
	description:
		"Dental Practice Management System with AI diagnostics and secure medical records.",
	keywords: ["dental", "clinic", "management", "AI", "medical records"],
	authors: [{ name: "S.M.I.L.E Team" }],
	robots: { index: false, follow: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	// No maximumScale: pinch-zoom must stay available for readability.
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const publicConfig = getPublicConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* Apply the saved UI scale before first paint so the page doesn't
				    reflow from the default size once ScaleProvider hydrates. */}
				<script
					dangerouslySetInnerHTML={{
						__html: `try{var s=localStorage.getItem('smile-ui-scale');document.documentElement.dataset.uiScale=(s==='sm'||s==='md'||s==='lg')?s:'sm'}catch(e){}`,
					}}
				/>
			</head>
			<body
				className={`${geistMono.variable} ${anta.variable} ${genos.variable} font-sans antialiased`}
			>
				<PublicConfigProvider config={publicConfig}>
					<Providers>{children}</Providers>
				</PublicConfigProvider>
			</body>
		</html>
	);
}
