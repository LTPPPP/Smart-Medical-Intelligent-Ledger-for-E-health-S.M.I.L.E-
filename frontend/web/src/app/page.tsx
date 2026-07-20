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
		<div className="min-h-screen overflow-x-hidden bg-white font-poppins dark:bg-[#0B1420]">
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
