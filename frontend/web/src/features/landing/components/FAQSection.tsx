"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { useTranslation } from "@/features/i18n";

import { GradientText } from "./GradientText";

const faqs = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);
	const { t } = useTranslation();

	return (
		<section className="px-4 py-16 md:px-6">
			<div className="mx-auto max-w-[820px]">
				{/* Section Header */}
				<motion.div
					className="mb-12 flex flex-col items-center gap-4"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					<div className="flex items-center gap-2 rounded-full border border-smile-primary/10 bg-smile-primary/[0.04] px-5 py-2 backdrop-blur-sm dark:border-white/[0.10] dark:bg-white/[0.04]">
						<span className="font-poppins text-xs font-medium text-smile-description dark:text-[#8B9199]">
							{t("landing.faq.badge", "Q&A")}
						</span>
					</div>
					<GradientText
						as="h2"
						className="text-center font-poppins text-3xl font-bold md:text-[48px] md:leading-[66px]"
					>
						{t("landing.faq.heading", "Frequently Asked Questions")}
					</GradientText>
				</motion.div>

				{/* Accordion */}
				<div className="flex flex-col gap-3">
					{faqs.map((faqKey, i) => {
						const isOpen = openIndex === i;
						return (
							<motion.div
								key={faqKey}
								className="overflow-hidden rounded-2xl backdrop-blur-sm"
								style={{
									background: "var(--surface-panel-bg)",
									border: "1px solid var(--surface-panel-border)",
									boxShadow: "var(--surface-panel-shadow)",
								}}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-40px" }}
								transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
							>
								<button
									type="button"
									onClick={() => setOpenIndex(isOpen ? null : i)}
									aria-expanded={isOpen}
									className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
								>
									<span className="font-poppins text-sm font-semibold text-smile-title md:text-base dark:text-white">
										{t(`landing.faq.${faqKey}.question`)}
									</span>
									<Icon
										icon="lucide:chevron-down"
										width={18}
										className={`shrink-0 text-smile-primary transition-transform duration-200 dark:text-[#92CDFD] ${isOpen ? "rotate-180" : ""}`}
									/>
								</button>
								<AnimatePresence initial={false}>
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2, ease: "easeOut" }}
										>
											<p className="px-6 pb-5 font-poppins text-sm leading-relaxed text-smile-description dark:text-[#8B9199]">
												{t(`landing.faq.${faqKey}.answer`)}
											</p>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
