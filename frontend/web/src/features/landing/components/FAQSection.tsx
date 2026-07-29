"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { GradientText } from "./GradientText";

const faqs = [
	{
		question: "How does AI-assisted diagnosis work?",
		answer:
			"Our AI analyzes uploaded dental images and flags areas of concern in seconds, giving your dentist a data-backed second opinion before finalizing a treatment plan.",
	},
	{
		question: "Is my medical data secure?",
		answer:
			"All patient data is protected with AES-256 encryption both at rest and in transit, and our infrastructure follows HIPAA, ISO 27001 and SOC 2 Type II standards.",
	},
	{
		question: "Can I book appointments across different clinics?",
		answer:
			"Yes. S.M.I.L.E lets you search specialists and book appointments at any clinic in our network from a single account.",
	},
	{
		question: "How do I reach my doctor between visits?",
		answer:
			"Open the profile menu in the header and select Chat to message your care team directly, without needing to schedule a full visit.",
	},
	{
		question: "Who can access my health records?",
		answer:
			"Only you and the clinicians directly involved in your care can view your records. Every access is role-restricted and logged for audit purposes.",
	},
	{
		question: "Is S.M.I.L.E free to use for patients?",
		answer:
			"Creating an account, booking appointments and messaging your care team are free for patients. Clinics may charge for treatments and services separately.",
	},
] as const;

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	return (
		<section className="px-4 py-16 md:px-6">
			<div className="mx-auto max-w-[820px]">
				{/* Section header */}
				<motion.div
					className="mb-12 flex flex-col items-center gap-4"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					<div className="flex items-center gap-2 rounded-full border border-smile-primary/10 bg-smile-primary/[0.04] px-5 py-2 backdrop-blur-sm dark:border-white/[0.10] dark:bg-white/[0.04]">
						<span className="font-poppins text-xs font-medium text-smile-description dark:text-[#8B9199]">
							Q&amp;A
						</span>
					</div>
					<GradientText
						as="h2"
						className="text-center font-poppins text-3xl font-bold md:text-[3rem] md:leading-[66px]"
					>
						Frequently Asked Questions
					</GradientText>
				</motion.div>

				{/* Accordion */}
				<div className="flex flex-col gap-3">
					{faqs.map((faq, i) => {
						const isOpen = openIndex === i;
						return (
							<motion.div
								key={faq.question}
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
										{faq.question}
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
												{faq.answer}
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
