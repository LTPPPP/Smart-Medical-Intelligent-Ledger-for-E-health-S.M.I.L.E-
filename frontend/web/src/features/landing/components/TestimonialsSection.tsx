"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { GradientText } from "./GradientText";

const testimonials = [
	{
		name: "Emily Carter",
		role: "Patient · Implant Treatment",
		initials: "EC",
		rating: 5,
		accent: "#92CDFD",
		quote:
			"The AI diagnostics caught an issue my previous dentist missed. Booking was effortless and I could track my whole treatment plan from my phone.",
	},
	{
		name: "Michael Nguyen",
		role: "Patient · Orthodontics",
		initials: "MN",
		rating: 5,
		accent: "#38BDF8",
		quote:
			"I switched clinics mid-treatment and my full history moved with me instantly. No repeated X-rays, no lost paperwork — just seamless care.",
	},
	{
		name: "Sophia Tran",
		role: "Patient · Routine Checkup",
		initials: "ST",
		rating: 5,
		accent: "#60A5FA",
		quote:
			"Chatting directly with my dentist between visits saved me an unnecessary trip. The whole platform feels fast, secure, and genuinely helpful.",
	},
	{
		name: "David Kim",
		role: "Patient · Root Canal",
		initials: "DK",
		rating: 4,
		accent: "#92CDFD",
		quote:
			"Scheduling across two clinics used to be a headache. Now I book, get reminders, and see my records in one place — it just works.",
	},
	{
		name: "Ava Johnson",
		role: "Patient · Pediatric Dentistry",
		initials: "AJ",
		rating: 5,
		accent: "#38BDF8",
		quote:
			"As a parent, knowing my kid's records are encrypted and only visible to our care team gives me real peace of mind.",
	},
	{
		name: "Liam Pham",
		role: "Patient · Teeth Whitening",
		initials: "LP",
		rating: 5,
		accent: "#60A5FA",
		quote:
			"The before/after tracking with AI photo analysis was such a nice touch. I actually looked forward to my follow-up appointments.",
	},
	{
		name: "Grace Le",
		role: "Patient · Braces",
		initials: "GL",
		rating: 4,
		accent: "#92CDFD",
		quote:
			"Two-year treatment, zero paperwork hassle. Every visit, every note and every invoice was right there when I needed it.",
	},
] as const;

function StarRating({ rating, accent }: { rating: number; accent: string }) {
	return (
		<div className="flex items-center gap-0.5">
			{Array.from({ length: 5 }).map((_, i) => (
				<Icon
					key={i}
					icon={i < rating ? "solar:star-bold" : "lucide:star"}
					width={15}
					style={i < rating ? { color: accent } : undefined}
					className={i < rating ? "" : "text-smile-description/25"}
				/>
			))}
		</div>
	);
}

function TestimonialCard({
	testimonial,
}: { testimonial: (typeof testimonials)[number] }) {
	return (
		<div
			className="group relative flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-3xl p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 md:w-[400px] md:p-8"
			style={{
				background: "var(--surface-panel-bg)",
				border: "1px solid var(--surface-panel-border)",
				boxShadow: "var(--surface-panel-shadow)",
			}}
		>
			<div
				className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background: `radial-gradient(120% 100% at 0% 0%, ${testimonial.accent}14, transparent 60%)`,
				}}
			/>

			<Icon
				icon="lucide:quote"
				width={34}
				className="relative z-10 mb-4 shrink-0"
				style={{ color: `${testimonial.accent}55` }}
			/>

			<p className="relative z-10 line-clamp-5 flex-1 font-poppins text-base leading-relaxed text-smile-title md:text-[17px] dark:text-white">
				&ldquo;{testimonial.quote}&rdquo;
			</p>

			<div
				className="relative z-10 mt-6 flex items-center justify-between gap-3 border-t pt-5"
				style={{ borderColor: "var(--surface-panel-border)" }}
			>
				<div className="flex min-w-0 items-center gap-3">
					<div
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
						style={{ background: testimonial.accent }}
					>
						{testimonial.initials}
					</div>
					<div className="min-w-0 text-left">
						<p className="truncate font-poppins text-sm font-semibold text-smile-title dark:text-white">
							{testimonial.name}
						</p>
						<p className="truncate font-poppins text-xs text-smile-description dark:text-[#8B9199]">
							{testimonial.role}
						</p>
					</div>
				</div>
				<StarRating rating={testimonial.rating} accent={testimonial.accent} />
			</div>
		</div>
	);
}

export function TestimonialsSection() {
	const loopTestimonials = [...testimonials, ...testimonials];

	return (
		<section className="overflow-hidden px-4 py-20 md:px-6">
			<div className="mx-auto max-w-[1280px]">
				{/* Section header */}
				<motion.div
					className="mb-14 flex flex-col items-center gap-4 px-4"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					<div className="flex items-center gap-2 rounded-full border border-smile-primary/10 bg-smile-primary/[0.04] px-5 py-2 backdrop-blur-sm dark:border-white/[0.10] dark:bg-white/[0.04]">
						<Icon
							icon="lucide:heart-handshake"
							width={14}
							className="text-smile-primary dark:text-[#92CDFD]"
						/>
						<span className="font-poppins text-xs font-medium text-smile-description dark:text-[#8B9199]">
							Patient Stories
						</span>
					</div>
					<GradientText
						as="h2"
						className="text-center font-poppins text-3xl font-bold md:text-[48px] md:leading-[66px]"
					>
						Loved by Patients
					</GradientText>
					<p className="max-w-[520px] text-center font-poppins text-sm leading-relaxed text-smile-description dark:text-[#8B9199]">
						Real experiences from real patients across our clinic network.
					</p>
				</motion.div>
			</div>

			{/* Auto-sliding marquee */}
			<div
				className="relative"
				style={{
					maskImage:
						"linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
					WebkitMaskImage:
						"linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
				}}
			>
				<div className="testimonial-marquee flex w-max gap-6 py-2">
					{loopTestimonials.map((testimonial, i) => (
						<TestimonialCard
							key={`${testimonial.name}-${i}`}
							testimonial={testimonial}
						/>
					))}
				</div>
			</div>

			<style>{`
                @keyframes smile-testimonial-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .testimonial-marquee {
                    animation: smile-testimonial-scroll 50s linear infinite;
                }
                .testimonial-marquee:hover {
                    animation-play-state: paused;
                }
                @media (prefers-reduced-motion: reduce) {
                    .testimonial-marquee {
                        animation: none;
                    }
                }
            `}</style>
		</section>
	);
}
