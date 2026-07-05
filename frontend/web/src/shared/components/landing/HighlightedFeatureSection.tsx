// ============================================================
// HighlightedFeatureSection — Showcases AI diagnostics capability
// Large card (left) + two stacked cards (right)
// ============================================================

import Image from "next/image";

import { GradientText } from "./GradientText";

export function HighlightedFeatureSection() {
    return (
        <section className="px-4 py-12 md:px-6">
            <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[1fr_362px]">
                {/* Main highlighted card */}
                <div className="relative overflow-hidden rounded-[15px] border border-smile-primary bg-gradient-to-b from-white from-[-72%] to-[#BAE3FF] to-[10%] p-8 dark:from-[#1a1a2e] dark:from-[-72%] dark:to-[#0f2a3a] dark:to-[10%]">
                    <div className="relative z-10">
                        <GradientText
                            as="h2"
                            className="max-w-[396px] font-poppins text-3xl font-semibold leading-tight md:text-[45px] md:leading-[68px]"
                        >
                            The Highlighted Feature
                        </GradientText>
                    </div>

                    {/* AI diagnostic image */}
                    <div className="absolute -bottom-4 right-4 top-0 flex items-center md:right-12">
                        <Image
                            src="/images/landing/glassy-block.svg"
                            alt="AI dental diagnostics visualization"
                            width={394}
                            height={450}
                            className="h-auto max-h-[400px] w-auto object-contain opacity-90"
                        />
                    </div>

                    {/* Accuracy label */}
                    <p className="relative z-10 mt-auto pt-[280px] font-poppins text-lg text-smile-title md:pt-[320px] dark:text-gray-300">
                        Accuracy: 99.4%
                    </p>
                </div>

                {/* Right column: two stacked cards */}
                <div className="flex flex-col gap-6">
                    {/* Processing Speed card */}
                    <div className="flex h-[188px] items-end rounded-[15px] border border-smile-primary bg-gradient-to-b from-white to-[#BAE3FF] p-6 dark:from-[#1a1a2e] dark:to-[#0f2a3a]">
                        <h3 className="font-poppins text-xl font-medium leading-[38px] text-smile-primary md:text-[25px] dark:text-smile-primary-light/90">
                            Processing Speed &lt; 0.8s
                        </h3>
                    </div>

                    {/* Encryption card */}
                    <div className="flex h-[188px] items-end justify-end rounded-[15px] border border-smile-primary bg-gradient-to-b from-white to-[#BAE3FF] p-6 dark:from-[#1a1a2e] dark:to-[#0f2a3a]">
                        <h3 className="max-w-[172px] text-right font-poppins text-xl font-medium leading-[38px] text-smile-primary md:text-[25px] dark:text-smile-primary-light/90">
                            AES-256 Encrypted
                        </h3>
                    </div>
                </div>
            </div>
        </section>
    );
}
