import {
	LandingHeader,
	HeroSection,
	StatsSection,
	FeaturesSection,
	HighlightedFeatureSection,
	WorkflowSection,
	LandingFooter,
	LandingRedirectGuard,
} from "@/features/landing/components";

export default function HomePage() {
	return (
		<div className="min-h-screen overflow-x-hidden bg-white font-poppins dark:bg-[#111416]">
			<LandingRedirectGuard />
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
