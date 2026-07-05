// ============================================================
// HeroSection — Main hero with doctor/teeth images, gradient title,
// search bar, and floating glass info cards
// ============================================================

import Image from "next/image";
import { Activity } from "lucide-react";

import { GradientText } from "./GradientText";
import { GlassCard } from "./GlassCard";
import { SearchBar } from "./SearchBar";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden px-4 pb-8 pt-6 md:px-6">
            {/* Decorative background blobs */}
            <div className="pointer-events-none absolute -top-40 left-0 h-[508px] w-[331px] -rotate-[6.94deg] rounded-full bg-smile-primary-light opacity-60 blur-[100px] dark:bg-smile-primary-dark/30" />
            <div className="pointer-events-none absolute -right-20 -top-16 h-96 w-96 rounded-full bg-smile-primary-light opacity-60 blur-[100px] dark:bg-smile-primary-dark/30" />

            <div className="relative mx-auto max-w-[1280px]">
                {/* Fast Treatment badge */}
                <div className="mb-8 flex justify-center">
                    <GlassCard className="flex items-center gap-2 rounded-[5px] bg-white/65 px-5 py-2.5 shadow-[0px_5px_5px_rgba(0,0,0,0.25),inset_-2px_-2px_4px_rgba(255,255,255,0.25),inset_2px_2px_4px_rgba(255,255,255,0.25)] dark:bg-white/10">
                        <Activity size={24} className="text-smile-primary" />
                        <span className="font-poppins text-base text-smile-primary">
                            Fast Treatment
                        </span>
                    </GlassCard>
                </div>

                {/* Main hero content: 3-column grid */}
                <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
                    {/* Left: Doctor image */}
                    <div className="relative mx-auto w-full max-w-[300px] lg:mx-0">
                        {/* Pill-shaped gradient background */}
                        <div className="mx-auto h-[350px] w-[220px] rounded-[151px] bg-gradient-to-b from-[rgba(211,228,239,0.8)] via-[rgba(48,154,212,0.8)] to-[rgba(25,89,128,0.8)] md:h-[409px] md:w-[249px] dark:from-[rgba(15,42,58,0.8)] dark:via-[rgba(48,154,212,0.4)] dark:to-[rgba(10,46,74,0.6)]" />
                        {/* Doctor image overlay */}
                        <div className="absolute inset-0 flex items-end justify-center">
                            <Image
                                src="/images/landing/doctor.svg"
                                alt="Expert dentist"
                                width={264}
                                height={360}
                                className="rounded-[25px] object-contain"
                                priority
                            />
                        </div>
                        {/* Floating card: DR. JOE */}
                        <GlassCard className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-b-[5px] px-6 py-2 text-center">
                            <p className="font-poppins text-base font-semibold text-smile-primary">
                                DR. JOE
                            </p>
                            <p className="font-poppins text-[15px] text-smile-title">
                                Implantologist
                            </p>
                        </GlassCard>
                        {/* Floating card: 10+ YEARS */}
                        <GlassCard className="absolute right-0 top-16 rounded-b-[5px] px-3 py-2 text-center">
                            <p className="font-poppins text-base font-semibold text-smile-primary">
                                10+ YEARS
                            </p>
                            <p className="font-poppins text-[15px] text-smile-title">Exp</p>
                        </GlassCard>
                    </div>

                    {/* Center: Title + Search */}
                    <div className="flex flex-col items-center text-center">
                        <GradientText
                            as="h1"
                            className="font-poppins text-4xl font-semibold leading-tight md:text-[50px] md:leading-[75px]"
                        >
                            NEXT-GEN DENTISTRY
                        </GradientText>
                        <p className="mt-2 max-w-[539px] font-poppins text-base text-smile-description">
                            Experience the perfect blend of AI diagnostics and
                            secure digital records for your smile.
                        </p>
                        <div className="mt-8 w-full max-w-[430px]">
                            <SearchBar />
                        </div>
                    </div>

                    {/* Right: Teeth image */}
                    <div className="relative mx-auto w-full max-w-[300px] lg:mx-0">
                        {/* Pill-shaped white background */}
                        <div className="mx-auto h-[350px] w-[220px] rounded-[151px] bg-white md:h-[409px] md:w-[249px] dark:bg-[#1a1a2e]" />
                        {/* Teeth image overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                                src="/images/landing/glassy-teeth.svg"
                                alt="AI dental diagnostics"
                                width={261}
                                height={370}
                                className="rounded-[135px] object-contain drop-shadow-[0px_8px_5px_rgba(0,0,0,0.25)]"
                            />
                        </div>
                        {/* Floating card: AI Diagnostics */}
                        <GlassCard className="absolute right-0 top-10 rounded-b-[5px] px-3 py-2 text-center">
                            <p className="font-poppins text-base font-semibold text-smile-primary">
                                AI Diagnostics
                            </p>
                            <p className="font-poppins text-[15px] text-smile-title">
                                99.4%
                            </p>
                        </GlassCard>
                        {/* Floating card: Data Secured */}
                        <GlassCard className="absolute -bottom-4 left-0 rounded-b-[5px] px-3 py-2 text-center">
                            <p className="font-poppins text-base font-semibold text-smile-primary">
                                Data Secured
                            </p>
                            <p className="font-poppins text-[15px] text-smile-title">
                                End-to-End Encrypted
                            </p>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </section>
    );
}
