"use client";

import Image from "next/image";
import Link from "next/link";

import { useTranslation } from "@/features/i18n";

const platformLinks = [
	{ key: "aiDiagnostics", fallback: "AI Diagnostics" },
	{ key: "digitalTwinMapping", fallback: "Digital Twin Mapping" },
	{ key: "healthRecords", fallback: "Health Records" },
	{ key: "smartScheduling", fallback: "Smart Scheduling" },
] as const;

const companyLinks = [
	{ key: "about", fallback: "About S.M.I.L.E" },
	{ key: "clinicalNetwork", fallback: "Clinical Network" },
	{ key: "researchPapers", fallback: "Research Papers" },
	{ key: "careers", fallback: "Careers" },
] as const;

const securityBadges = ["HIPAA", "ISO 27001", "SOC 2 TYPE II", "GDPR"] as const;

export function LandingFooter() {
	const { t } = useTranslation();

	return (
		<footer
			style={{
				background: "var(--surface-footer-bg)",
				borderTop: "1px solid var(--surface-footer-border)",
			}}
		>
			<div className="mx-auto max-w-[1280px] px-8 pb-0 pt-14">
				{/* Top section: 4-column grid */}
				<div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
					{/* Brand column */}
					<div className="flex flex-col gap-6">
						<Link href="/" className="flex items-center gap-2.5">
							<Image
								src="/images/logo.png"
								alt="S.M.I.L.E Logo"
								width={34}
								height={34}
							/>
							<span className="font-poppins text-xl font-semibold tracking-[3px] text-smile-primary dark:text-[#92CDFD]">
								S.M.I.L.E
							</span>
						</Link>
						<p className="font-inter text-sm leading-relaxed text-smile-description dark:text-[#8B9199]">
							{t(
								"landing.footer.tagline",
								"Setting the global standard for clinical precision and patient data security through AI-powered innovation.",
							)}
						</p>
					</div>

					{/* Platform column */}
					<div className="flex flex-col gap-6">
						<h4 className="font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-primary dark:text-[#38BDF8]">
							{t("landing.footer.platform", "Platform")}
						</h4>
						<ul className="flex flex-col gap-4">
							{platformLinks.map((link) => (
								<li key={link.key}>
									<Link
										href="#"
										className="font-inter text-sm text-smile-description transition-colors hover:text-smile-primary dark:text-[#8B9199] dark:hover:text-[#92CDFD]"
									>
										{t(`landing.footer.platformLinks.${link.key}`, link.fallback)}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Company column */}
					<div className="flex flex-col gap-6">
						<h4 className="font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-primary dark:text-[#38BDF8]">
							{t("landing.footer.company", "Company")}
						</h4>
						<ul className="flex flex-col gap-4">
							{companyLinks.map((link) => (
								<li key={link.key}>
									<Link
										href="#"
										className="font-inter text-sm text-smile-description transition-colors hover:text-smile-primary dark:text-[#8B9199] dark:hover:text-[#92CDFD]"
									>
										{t(`landing.footer.companyLinks.${link.key}`, link.fallback)}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Security column */}
					<div className="flex flex-col gap-6">
						<h4 className="font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-primary dark:text-[#38BDF8]">
							{t("landing.footer.security", "Security")}
						</h4>
						<div className="grid grid-cols-2 gap-2">
							{securityBadges.map((badge) => (
								<div
									key={badge}
									className="flex items-center justify-center rounded-lg border border-smile-primary/15 bg-smile-primary/[0.04] px-3 py-2 backdrop-blur-sm dark:border-[rgba(56, 189, 248,0.2)] dark:bg-[rgba(56, 189, 248,0.04)]"
								>
									<span className="font-inter text-[10px] font-bold uppercase tracking-[1px] text-smile-primary/70 dark:text-[#38BDF8]/70">
										{badge}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-smile-primary/[0.06] py-8 md:flex-row dark:border-white/[0.06]">
					<p className="font-inter text-sm text-smile-description dark:text-[#8B9199]">
						{t(
							"landing.footer.copyright",
							"© 2026 S.M.I.L.E Dental Platform. Clinical Precision. AI Powered.",
						)}
					</p>
					<div className="flex gap-8">
						<Link
							href="#"
							className="font-inter text-sm text-smile-description transition-colors hover:text-smile-primary dark:text-[#8B9199] dark:hover:text-[#92CDFD]"
						>
							{t("landing.footer.privacyPolicy", "Privacy Policy")}
						</Link>
						<Link
							href="#"
							className="font-inter text-sm text-smile-description transition-colors hover:text-smile-primary dark:text-[#8B9199] dark:hover:text-[#92CDFD]"
						>
							{t("landing.footer.termsOfService", "Terms of Service")}
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
