/* eslint-disable import/order */
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Anta, Genos } from "next/font/google";
/* eslint-enable import/order */

import { Providers } from "./provider/Providers";
import "./globals.css";

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
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistMono.variable} ${anta.variable} ${genos.variable} font-sans antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
