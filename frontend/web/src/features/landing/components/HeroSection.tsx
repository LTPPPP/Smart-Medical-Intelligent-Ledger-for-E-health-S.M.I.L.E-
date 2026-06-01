"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";

import { GradientText } from "./GradientText";
import { GlassCard } from "./GlassCard";
import { SearchBar } from "./SearchBar";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden px-4 pb-20 pt-14 md:px-6">
            {/* Animated liquid background blobs */}
            <div
                className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full liquid-blob"
                style={{ background: "var(--blob-primary)" }}
            />
            <div
                className="pointer-events-none absolute -right-32 top-16 h-[500px] w-[500px] rounded-full liquid-blob-slow"
                style={{ background: "var(--blob-secondary)" }}
            />
            <div
                className="pointer-events-none absolute bottom-0 left-1/2 h-[320px] w-[480px] -translate-x-1/2 rounded-full liquid-blob-fast"
                style={{ background: "var(--blob-tertiary)" }}
            />

            <div className="relative mx-auto max-w-[1280px]">
                {/* Fast Treatment badge */}
                <motion.div
                    className="mb-12 flex justify-center"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div
                        className="flex items-center gap-2.5 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-6 py-2.5 backdrop-blur-sm dark:border-[rgba(69,240,207,0.3)] dark:bg-[rgba(69,240,207,0.06)]"
                    >
                        <Icon icon="lucide:activity" width={18} className="text-smile-primary dark:text-[#45F0CF]" />
                        <span className="font-poppins text-sm font-medium text-smile-primary dark:text-[#45F0CF]">
                            Fast Treatment
                        </span>
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-primary dark:bg-[#45F0CF]" />
                    </div>
                </motion.div>

                {/* Main hero: 3-column grid */}
                <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">

                    {/* Left: Doctor image */}
                    <motion.div
                        className="relative mx-auto w-full max-w-[300px] lg:mx-0"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                    >
                        <div
                            className="mx-auto h-[380px] w-[230px] rounded-[151px] backdrop-blur-sm md:h-[430px] md:w-[260px]"
                            style={{
                                background: "var(--hero-pill-primary-bg)",
                                border: "1px solid var(--hero-pill-primary-border)",
                                boxShadow: "var(--hero-pill-primary-shadow)",
                            }}
                        />
                        <div className="absolute inset-0 flex items-end justify-center">
                            <motion.div
                                animate={{ y: [0, -14, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Image
                                    src="/images/doctor.png"
                                    alt="Expert dentist"
                                    width={280}
                                    height={400}
                                    className="rounded-[25px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                                    priority
                                />
                            </motion.div>
                        </div>
                        <GlassCard className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl px-6 py-3 text-center">
                            <p className="font-poppins text-sm font-bold text-smile-primary dark:text-[#92CDFD]">DR. JOE</p>
                            <p className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">Implantologist</p>
                        </GlassCard>
                        <GlassCard className="absolute right-0 top-16 rounded-2xl px-4 py-3 text-center">
                            <p className="font-poppins text-sm font-bold text-smile-primary dark:text-[#45F0CF]">10+ YEARS</p>
                            <p className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">Exp</p>
                        </GlassCard>
                    </motion.div>

                    {/* Center: Title + Search */}
                    <motion.div
                        className="flex flex-col items-center text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                    >
                        <GradientText
                            as="h1"
                            className="font-poppins text-4xl font-bold leading-tight tracking-tight md:text-[56px] md:leading-[76px]"
                        >
                            NEXT-GEN
                            <br />
                            DENTISTRY
                        </GradientText>
                        <p className="mt-4 max-w-[460px] font-poppins text-sm leading-relaxed text-smile-description dark:text-[#8B9199]">
                            Experience the perfect blend of AI diagnostics and clinical
                            precision for your smile.
                        </p>
                        <div className="mt-8 w-full max-w-[440px]">
                            <SearchBar />
                        </div>
                        {/* Trust badges */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-smile-primary dark:bg-[#45F0CF]" />
                                <span className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">HIPAA Compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-smile-primary dark:bg-[#92CDFD]" />
                                <span className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">AES-256 Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-smile-accent dark:bg-[#5eff88]" />
                                <span className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">ISO 27001</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Teeth image */}
                    <motion.div
                        className="relative mx-auto w-full max-w-[300px] lg:mx-0"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                    >
                        <div
                            className="mx-auto h-[380px] w-[230px] rounded-[151px] backdrop-blur-sm md:h-[430px] md:w-[260px]"
                            style={{
                                background: "var(--hero-pill-secondary-bg)",
                                border: "1px solid var(--hero-pill-secondary-border)",
                                boxShadow: "var(--hero-pill-secondary-shadow)",
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ y: [0, -14, 0] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                            >
                                <Image
                                    src="/images/glassy_teeth.png"
                                    alt="AI dental diagnostics"
                                    width={270}
                                    height={400}
                                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                                />
                            </motion.div>
                        </div>
                        <GlassCard className="absolute right-0 top-10 rounded-2xl px-4 py-3 text-center">
                            <p className="font-poppins text-sm font-bold text-smile-primary dark:text-[#92CDFD]">AI Diagnostics</p>
                            <p className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">99.4% Accuracy</p>
                        </GlassCard>
                        <GlassCard className="absolute -bottom-5 left-0 rounded-2xl px-4 py-3 text-center">
                            <p className="font-poppins text-sm font-bold text-smile-primary dark:text-[#45F0CF]">Data Secure</p>
                            <p className="font-poppins text-xs text-smile-description dark:text-[#8B9199]">AES-256 Encrypted</p>
                        </GlassCard>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
