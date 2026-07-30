"use client";

import { motion } from "framer-motion";

import { useTranslation } from "@/features/i18n";

import { GradientText } from "./GradientText";

const steps = [
	{
		number: "01",
		key: "step1",
		accent: "#92CDFD",
		borderColor: "rgba(146,205,253,0.2)",
		glowBg: "rgba(146,205,253,0.06)",
		glowShadow: "rgba(146,205,253,0.08)",
	},
	{
		number: "02",
		key: "step2",
		accent: "#38BDF8",
		borderColor: "rgba(56, 189, 248,0.2)",
		glowBg: "rgba(56, 189, 248,0.06)",
		glowShadow: "rgba(56, 189, 248,0.08)",
	},
	{
		number: "03",
		key: "step3",
		accent: "#60A5FA",
		borderColor: "rgba(96, 165, 250,0.2)",
		glowBg: "rgba(96, 165, 250,0.05)",
		glowShadow: "rgba(96, 165, 250,0.06)",
	},
] as const;

export function WorkflowSection() {
	const { t } = useTranslation();

	return (
		<section className="px-4 py-16 md:px-6">
			<div className="mx-auto max-w-[1280px]">
				{/* Section header */}
				<motion.div
					className="mb-16 flex flex-col items-center gap-4"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					<div className="flex items-center gap-2 rounded-full border border-smile-primary/10 bg-smile-primary/[0.04] px-5 py-2 backdrop-blur-sm dark:border-white/[0.10] dark:bg-white/[0.04]">
						<span className="font-poppins text-xs font-medium text-smile-description dark:text-[#8B9199]">
							{t("landing.workflow.badge", "How It Works")}
						</span>
					</div>
					<GradientText
						as="h2"
						className="text-center font-poppins text-3xl font-bold md:text-[48px] md:leading-[66px]"
					>
						{t("landing.workflow.heading", "The Patient-to-Doctor Workflow")}
					</GradientText>
				</motion.div>

				{/* Steps grid */}
				<div className="relative grid gap-6 md:grid-cols-3">
					{/* Gradient connecting line (desktop) */}
					<div
						className="pointer-events-none absolute left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] top-[40px] hidden h-px md:block"
						style={{
							background: "var(--gradient-connector)",
						}}
					/>

					{steps.map((step, i) => (
						<motion.div
							key={step.number}
							className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm transition-all duration-300"
							style={{
								background: "var(--surface-panel-bg)",
								border: `1px solid ${step.borderColor}`,
								boxShadow: `var(--surface-panel-shadow), 0 0 60px ${step.glowShadow}`,
							}}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
						>
							{/* Top shimmer */}
							<div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />

							{/* Number circle */}
							<div
								className="relative z-10 mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full"
								style={{
									border: `1px solid ${step.accent}40`,
									background: `radial-gradient(circle at 30% 30%, ${step.accent}18, transparent 70%)`,
									boxShadow: `0 0 30px ${step.accent}20`,
								}}
							>
								<span
									className="font-poppins text-3xl font-bold"
									style={{ color: step.accent }}
								>
									{step.number}
								</span>
							</div>

							{/* Title */}
							<h3
								className="relative z-10 mb-3 font-poppins text-lg font-semibold"
								style={{ color: step.accent }}
							>
								{t(`landing.workflow.${step.key}.title`)}
							</h3>

							{/* Description */}
							<p className="relative z-10 font-poppins text-sm leading-relaxed text-smile-description dark:text-[#8B9199]">
								{t(`landing.workflow.${step.key}.description`)}
							</p>

							{/* Bottom glow line on hover */}
							<div
								className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								style={{
									background: `linear-gradient(90deg, transparent, ${step.accent}80, transparent)`,
								}}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
