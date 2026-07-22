"use client";

import { useEffect, useState } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { ArrowButton } from "./ArrowButton";
import { GradientText } from "./GradientText";

const testimonials = [
    {
        name: "Emily Carter",
        role: "Patient · Implant Treatment",
        initials: "EC",
        rating: 5,
        accent: "#92CDFD",
        quote: "The AI diagnostics caught an issue my previous dentist missed. Booking was effortless and I could track my whole treatment plan from my phone.",
    },
    {
        name: "Michael Nguyen",
        role: "Patient · Orthodontics",
        initials: "MN",
        rating: 5,
        accent: "#38BDF8",
        quote: "I switched clinics mid-treatment and my full history moved with me instantly. No repeated X-rays, no lost paperwork — just seamless care.",
    },
    {
        name: "Sophia Tran",
        role: "Patient · Routine Checkup",
        initials: "ST",
        rating: 5,
        accent: "#60A5FA",
        quote: "Chatting directly with my dentist between visits saved me an unnecessary trip. The whole platform feels fast, secure, and genuinely helpful.",
    },
    {
        name: "David Kim",
        role: "Patient · Root Canal",
        initials: "DK",
        rating: 4,
        accent: "#92CDFD",
        quote: "Scheduling across two clinics used to be a headache. Now I book, get reminders, and see my records in one place — it just works.",
    },
    {
        name: "Ava Johnson",
        role: "Patient · Pediatric Dentistry",
        initials: "AJ",
        rating: 5,
        accent: "#38BDF8",
        quote: "As a parent, knowing my kid's records are encrypted and only visible to our care team gives me real peace of mind.",
    },
] as const;

export function TestimonialsSection() {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);

    const goTo = (next: number, dir: number) => {
        setDirection(dir);
        setIndex((next + testimonials.length) % testimonials.length);
    };

    useEffect(() => {
        if (paused) return;
        const t = setInterval(() => goTo(index + 1, 1), 6000);
        return () => clearInterval(t);
    }, [index, paused]);

    const active = testimonials[index];

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
                        <span className="font-poppins text-xs font-medium text-smile-description dark:text-[#8B9199]">Patient Stories</span>
                    </div>
                    <GradientText
                        as="h2"
                        className="text-center font-poppins text-3xl font-bold md:text-[48px] md:leading-[66px]"
                    >
                        Loved by Patients
                    </GradientText>
                </motion.div>

                {/* Slider */}
                <div
                    className="relative"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    <div
                        className="relative min-h-[280px] overflow-hidden rounded-2xl p-8 backdrop-blur-sm md:p-10"
                        style={{
                            background: "var(--surface-panel-bg)",
                            border: "1px solid var(--surface-panel-border)",
                            boxShadow: "var(--surface-panel-shadow)",
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />

                        <AnimatePresence mode="wait" custom={direction} initial={false}>
                            <motion.div
                                key={active.name}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -40 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="relative z-10 flex flex-col items-center text-center"
                            >
                                <Icon
                                    icon="lucide:quote"
                                    width={32}
                                    className="mb-5 text-smile-primary/40 dark:text-[#92CDFD]/40"
                                />
                                <p className="max-w-[560px] font-poppins text-base leading-relaxed text-smile-title md:text-lg dark:text-white">
                                    &ldquo;{active.quote}&rdquo;
                                </p>

                                <div className="mt-6 flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Icon
                                            key={i}
                                            icon={i < active.rating ? "solar:star-bold" : "lucide:star"}
                                            width={16}
                                            className={i < active.rating ? "text-amber-400" : "text-smile-description/30"}
                                        />
                                    ))}
                                </div>

                                <div className="mt-5 flex items-center gap-3">
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                        style={{ background: active.accent }}
                                    >
                                        {active.initials}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-poppins text-sm font-semibold text-smile-title dark:text-white">
                                            {active.name}
                                        </p>
                                        <p className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">
                                            {active.role}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Prev / Next controls */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <ArrowButton
                            size="sm"
                            rotation={-90}
                            onClick={() => goTo(index - 1, -1)}
                            ariaLabel="Previous testimonial"
                        />

                        {/* Dots */}
                        <div className="flex items-center gap-2">
                            {testimonials.map((t, i) => (
                                <button
                                    key={t.name}
                                    type="button"
                                    onClick={() => goTo(i, i > index ? 1 : -1)}
                                    aria-label={`Go to testimonial ${i + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-smile-primary dark:bg-[#92CDFD]" : "w-1.5 bg-smile-description/30"
                                        }`}
                                />
                            ))}
                        </div>

                        <ArrowButton
                            size="sm"
                            rotation={90}
                            onClick={() => goTo(index + 1, 1)}
                            ariaLabel="Next testimonial"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
