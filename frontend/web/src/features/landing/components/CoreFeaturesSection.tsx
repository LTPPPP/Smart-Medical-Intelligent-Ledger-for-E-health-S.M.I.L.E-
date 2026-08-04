"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { useTranslation } from "@/features/i18n";

import { GradientText } from "./GradientText";

const coreFeatures = [
	{ key: "aiDiagnostics", icon: "lucide:brain-circuit", accent: "#92CDFD" },
	{ key: "healthRecords", icon: "lucide:file-heart", accent: "#38BDF8" },
	{ key: "smartScheduling", icon: "lucide:calendar-clock", accent: "#60A5FA" },
	{ key: "multiClinic", icon: "lucide:hospital", accent: "#92CDFD" },
	{ key: "realTimeChat", icon: "lucide:message-circle", accent: "#38BDF8" },
	{ key: "roleReporting", icon: "lucide:shield-check", accent: "#60A5FA" },
] as const;

export function CoreFeaturesSection() {
	const { t } = useTranslation();

	return (
		<section className="px-4 py-16 md:px-6">
			<div className="mx-auto max-w-[1280px]">
				{/* Section Header */}
				<motion.div
					className="mb-14 flex flex-col items-center gap-4"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					<div className="flex items-center gap-2 rounded-full border border-smile-primary/10 bg-smile-primary/[0.04] px-5 py-2 backdrop-blur-sm dark:border-white/[0.10] dark:bg-white/[0.04]">
						<span className="font-poppins text-xs font-medium text-smile-description dark:text-[#8B9199]">
							{t("landing.coreFeatures.badge", "Core Capabilities")}
						</span>
					</div>
					<GradientText
						as="h2"
						className="text-center font-poppins text-3xl font-bold md:text-[48px] md:leading-[66px]"
					>
						{t("landing.coreFeatures.heading", "Everything Your Clinic Needs")}
					</GradientText>
				</motion.div>

				{/* Feature Grid */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{coreFeatures.map((feature, i) => (
						<motion.div
							key={feature.key}
							className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm transition-all duration-300"
							style={{
								background: "var(--surface-panel-bg)",
								border: "1px solid var(--surface-panel-border)",
								boxShadow: "var(--surface-panel-shadow)",
							}}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
						>
							<div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />

							<div
								className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
								style={{
									background: `${feature.accent}18`,
									border: `1px solid ${feature.accent}30`,
								}}
							>
								<Icon
									icon={feature.icon}
									width={22}
									style={{ color: feature.accent }}
								/>
							</div>

							<h3 className="relative z-10 mb-2 font-poppins text-lg font-semibold text-smile-title dark:text-white">
								{t(`landing.coreFeatures.${feature.key}.title`)}
							</h3>
							<p className="relative z-10 font-poppins text-sm leading-relaxed text-smile-description dark:text-[#8B9199]">
								{t(`landing.coreFeatures.${feature.key}.description`)}
							</p>

							<div
								className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								style={{
									background: `linear-gradient(90deg, transparent, ${feature.accent}80, transparent)`,
								}}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
