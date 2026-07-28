"use client";

import Image from "next/image";

import { motion } from "framer-motion";

import { ArrowButton } from "./ArrowButton";

const features = [
	{
		title: "Online Scheduling",
		image: "/images/glassy_feature-scheduling.png",
		imageWidth: 280,
		imageHeight: 200,
		imageAlt: "Online scheduling calendar",
		accent: "#92CDFD",
		glowColor: "rgba(146,205,253,0.08)",
		borderColor: "rgba(146,205,253,0.18)",
	},
	{
		title: "Digital Health Records",
		image: "/images/glassy_feature-records.png",
		imageWidth: 220,
		imageHeight: 290,
		imageAlt: "Digital health records",
		accent: "#38BDF8",
		glowColor: "rgba(56, 189, 248,0.08)",
		borderColor: "rgba(56, 189, 248,0.18)",
	},
	{
		title: "Centralized Clinic Management",
		image: "/images/glassy_feature-management.png",
		imageWidth: 250,
		imageHeight: 250,
		imageAlt: "Clinic management dashboard",
		accent: "#60A5FA",
		glowColor: "rgba(96, 165, 250,0.06)",
		borderColor: "rgba(96, 165, 250,0.18)",
	},
] as const;

export function FeaturesSection() {
	return (
		<section className="px-4 py-12 md:px-6">
			<div className="mx-auto grid max-w-[1280px] gap-6 md:grid-cols-2 lg:grid-cols-3">
				{features.map((feature, i) => (
					<motion.div
						key={feature.title}
						className="group relative"
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
					>
						{/* Glass card */}
						<div
							className="relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-500"
							style={{
								background: "var(--surface-panel-bg)",
								border: `1px solid ${feature.borderColor}`,
								boxShadow: `var(--surface-panel-shadow), 0 0 60px ${feature.glowColor}`,
							}}
						>
							{/* Top shimmer layer */}
							<div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />

							{/* Arrow button */}
							<div className="absolute right-4 top-4 z-10">
								<ArrowButton size="lg" rotation={41.6} />
							</div>

							{/* Image area */}
							<div className="flex h-[14.375rem] items-center justify-center pt-4 md:h-[16.875rem]">
								<Image
									src={feature.image}
									alt={feature.imageAlt}
									width={feature.imageWidth}
									height={feature.imageHeight}
									className="max-h-full w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105"
								/>
							</div>

							{/* Bottom accent line */}
							<div
								className="absolute bottom-0 left-0 right-0 h-[1px]"
								style={{
									background: `linear-gradient(90deg, transparent, ${feature.accent}80, transparent)`,
								}}
							/>
						</div>

						{/* Title */}
						<h3
							className="mt-4 text-right font-poppins text-lg font-semibold md:text-[1.375rem]"
							style={{ color: feature.accent }}
						>
							{feature.title}
						</h3>
					</motion.div>
				))}
			</div>
		</section>
	);
}
