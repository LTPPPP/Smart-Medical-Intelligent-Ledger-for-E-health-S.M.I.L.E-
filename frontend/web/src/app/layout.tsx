/* eslint-disable import/order */
import type { Metadata, Viewport } from "next";
import {
	Geist,
	Geist_Mono,
	Poppins,
	Inter,
	Public_Sans,
	Space_Grotesk,
} from "next/font/google";
/* eslint-enable import/order */

import { Providers } from "./provider/Providers";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-sans",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
});

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const publicSans = Public_Sans({
	variable: "--font-public-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

const spaceGrotesk = Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "S.M.I.L.E — Smart Medical Intelligent Ledger for E-health",
		template: "%s | S.M.I.L.E",
	},
	description:
		"Dental Practice Management System with AI diagnostics and blockchain-secured medical records.",
	keywords: [
		"dental",
		"clinic",
		"management",
		"AI",
		"blockchain",
		"medical records",
	],
	authors: [{ name: "S.M.I.L.E Team" }],
	robots: { index: false, follow: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
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
				className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} ${publicSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
