// ============================================================
// LandingFooter — Footer with brand, links, security badges & copyright
// ============================================================

import Image from "next/image";
import Link from "next/link";

const platformLinks = [
    "AI Diagnostics",
    "Digital Twin Mapping",
    "Blockchain Records",
    "Smart Scheduling",
] as const;

const companyLinks = [
    "About S.M.I.L.E",
    "Clinical Network",
    "Research Papers",
    "Careers",
] as const;

const securityBadges = [
    "HIPAA",
    "ISO 27001",
    "SOC 2 TYPE II",
    "GDPR",
] as const;

export function LandingFooter() {
    return (
        <footer className="bg-smile-footer-bg dark:bg-[#0d1b2a]">
            <div className="mx-auto max-w-[1280px] px-8 pb-0 pt-12">
                {/* Top section: 4-column grid */}
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand column */}
                    <div className="flex flex-col gap-6">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/images/landing/logo.svg"
                                alt="S.M.I.L.E Logo"
                                width={32}
                                height={32}
                            />
                            <span className="font-poppins text-2xl font-medium tracking-[2.4px] text-smile-primary">
                                SMILE
                            </span>
                        </Link>
                        <p className="font-inter text-sm leading-[23px] tracking-[-0.35px] text-[rgba(10,46,74,0.6)] dark:text-[rgba(200,210,220,0.6)]">
                            Setting the global standard for clinical precision and patient
                            data security through AI and Blockchain innovation.
                        </p>
                    </div>

                    {/* Platform column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="font-inter text-xs font-semibold uppercase tracking-[1.2px] text-smile-primary-dark dark:text-smile-primary-light">
                            Platform
                        </h4>
                        <ul className="flex flex-col gap-4">
                            {platformLinks.map((link) => (
                                <li key={link}>
                                    <Link
                                        href="#"
                                        className="font-inter text-sm tracking-[-0.35px] text-[rgba(10,46,74,0.6)] transition-colors hover:text-smile-primary dark:text-[rgba(200,210,220,0.6)] dark:hover:text-smile-primary-light"
                                    >
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="font-inter text-xs font-semibold uppercase tracking-[1.2px] text-smile-primary-dark dark:text-smile-primary-light">
                            Company
                        </h4>
                        <ul className="flex flex-col gap-4">
                            {companyLinks.map((link) => (
                                <li key={link}>
                                    <Link
                                        href="#"
                            className="font-inter text-sm tracking-[-0.35px] text-[rgba(10,46,74,0.6)] transition-colors hover:text-smile-primary dark:text-[rgba(200,210,220,0.6)] dark:hover:text-smile-primary-light"
                        >
                            {link}
                        </Link>
                    </li>
                ))}
                    </ul>
                </div>

                    {/* Security column */}
                    <div className="flex flex-col gap-6">
                        <h4 className="font-inter text-xs font-semibold uppercase tracking-[1.2px] text-smile-primary-dark dark:text-smile-primary-light">
                            Security
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {securityBadges.map((badge) => (
                                <div
                                    key={badge}
                                    className="flex items-center justify-center rounded border border-[rgba(10,46,74,0.1)] bg-white px-3 py-1 dark:border-[rgba(200,210,220,0.15)] dark:bg-[#1a1a2e]"
                                >
                                    <span className="font-inter text-[10px] font-bold uppercase tracking-[-0.35px] text-[rgba(10,46,74,0.4)] dark:text-[rgba(200,210,220,0.6)]">
                                        {badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[rgba(10,46,74,0.05)] py-8 md:flex-row dark:border-[rgba(200,210,220,0.1)]">
                    <p className="font-inter text-base text-[rgba(10,46,74,0.6)] dark:text-[rgba(200,210,220,0.6)]">
                        &copy; 2026 S.M.I.L.E Dental Platform. Clinical Precision.
                        Blockchain Verified.
                    </p>
                    <div className="flex gap-8">
                        <Link
                            href="#"
                            className="font-inter text-base text-[rgba(10,46,74,0.6)] transition-colors hover:text-smile-primary"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="#"
                            className="font-inter text-base text-[rgba(10,46,74,0.6)] transition-colors hover:text-smile-primary"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
