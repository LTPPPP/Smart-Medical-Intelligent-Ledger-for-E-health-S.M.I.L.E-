// ============================================================
// Landing page — Public-facing home page for S.M.I.L.E
// Showcases AI diagnostics, blockchain security, and clinic features
// ============================================================

import {
	LandingHeader,
	HeroSection,
	StatsSection,
	FeaturesSection,
	HighlightedFeatureSection,
	WorkflowSection,
	LandingFooter,
} from "@/features/landing/components";

export default function HomePage() {
	return (
		<div className="min-h-screen overflow-x-hidden bg-white font-poppins dark:bg-[#0d0d0d]">
			<LandingHeader />
			<main>
				<HeroSection />
				<StatsSection />
				<FeaturesSection />
				<HighlightedFeatureSection />
				<WorkflowSection />
			</main>
			<LandingFooter />
		</div>
	);
}
