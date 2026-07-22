import {
	LandingHeader,
	HeroSection,
	StatsSection,
	FeaturesSection,
	CoreFeaturesSection,
	HighlightedFeatureSection,
	WorkflowSection,
	TestimonialsSection,
	FAQSection,
	LandingFooter,
	ScrollToTopButton,
} from "@/features/landing/components";

export default function HomePage() {
	return (
		<div className="min-h-screen overflow-x-hidden bg-white font-poppins dark:bg-[#0B1420]">
			<LandingHeader />
			<main>
				<HeroSection />
				<StatsSection />
				<FeaturesSection />
				<CoreFeaturesSection />
				<HighlightedFeatureSection />
				<WorkflowSection />
				<TestimonialsSection />
				<FAQSection />
			</main>
			<LandingFooter />
			<ScrollToTopButton />
		</div>
	);
}
