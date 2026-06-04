import { Icon } from "@iconify/react";
import Image from "next/image";

import { GradientText } from "./GradientText";

export function HighlightedFeatureSection() {
    return (
        <section className="px-4 py-12 md:px-6">
            <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[1fr_362px]">

                {/* Main highlighted card */}
                <div
                    className="relative overflow-hidden rounded-2xl p-8 backdrop-blur-sm"
                    style={{
                        background: "var(--surface-panel-bg)",
                        border: "1px solid rgba(146,205,253,0.2)",
                        boxShadow: "0 0 80px rgba(146,205,253,0.06), var(--surface-panel-shadow)",
                    }}
                >
                    {/* Top shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#92CDFD]/[0.05] via-transparent to-transparent" />

                    {/* Content */}
                    <div className="relative z-10">
                        <div
                            className="mb-5 inline-flex items-center gap-2 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-4 py-1.5 dark:border-[rgba(146,205,253,0.3)] dark:bg-[rgba(146,205,253,0.06)]"
                        >
                            <Icon icon="lucide:brain-circuit" width={15} className="text-smile-primary dark:text-[#92CDFD]" />
                            <span className="font-poppins text-xs font-medium text-smile-primary dark:text-[#92CDFD]">AI Powered</span>
                        </div>
                        <GradientText
                            as="h2"
                            className="max-w-[380px] font-poppins text-3xl font-bold leading-tight md:text-[44px] md:leading-[60px]"
                        >
                            The Highlighted Feature
                        </GradientText>
                    </div>

                    {/* Block/AI visualization image */}
                    <div className="absolute -bottom-6 right-4 top-0 flex items-center md:right-10">
                        <Image
                            src="/images/glassy_block.png"
                            alt="AI dental diagnostics visualization"
                            width={420}
                            height={480}
                            className="h-auto max-h-[420px] w-auto object-contain opacity-90"
                            style={{ filter: "drop-shadow(0 0 40px rgba(146,205,253,0.25))" }}
                        />
                    </div>

                    {/* Accuracy badge */}
                    <div className="relative z-10 pt-[270px] md:pt-[310px]">
                        <div
                            className="inline-flex items-center gap-2.5 rounded-full border border-smile-primary/25 bg-smile-primary/5 px-5 py-2 dark:border-[rgba(69,240,207,0.3)] dark:bg-[rgba(69,240,207,0.07)]"
                        >
                            <div className="h-2 w-2 animate-pulse rounded-full bg-smile-primary dark:bg-[#45F0CF]" />
                            <span className="font-poppins text-sm font-semibold text-smile-primary dark:text-[#45F0CF]">
                                Accuracy: 99.4%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right column: two stacked glass cards */}
                <div className="flex flex-col gap-6">

                    {/* Processing Speed card */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm"
                        style={{
                            background: "var(--surface-panel-bg)",
                            border: "1px solid rgba(69,240,207,0.2)",
                            boxShadow: "0 0 50px rgba(69,240,207,0.05), var(--surface-panel-shadow)",
                            minHeight: "188px",
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#45F0CF]/[0.04] via-transparent to-transparent" />
                        {/* Tool image top-right */}
                        <div className="absolute right-4 top-4 opacity-70">
                            <Image
                                src="/images/glassy_tool.png"
                                alt="Processing speed"
                                width={90}
                                height={75}
                                className="h-auto w-auto object-contain"
                                style={{ filter: "drop-shadow(0 0 10px rgba(69,240,207,0.3))" }}
                            />
                        </div>
                        <div className="relative z-10 flex h-full flex-col justify-end pt-[100px]">
                            <p className="font-poppins text-sm font-medium text-smile-primary dark:text-[#45F0CF]">Processing Speed</p>
                            <p className="font-poppins text-3xl font-bold text-smile-title dark:text-white">&lt; 0.8s</p>
                        </div>
                    </div>

                    {/* Encryption card */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm"
                        style={{
                            background: "var(--surface-panel-bg)",
                            border: "1px solid rgba(146,205,253,0.2)",
                            boxShadow: "0 0 50px rgba(146,205,253,0.05), var(--surface-panel-shadow)",
                            minHeight: "188px",
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-bl from-[#92CDFD]/[0.04] via-transparent to-transparent" />
                        {/* Tooth image bottom-left */}
                        <div className="absolute left-4 top-4 opacity-70">
                            <Image
                                src="/images/glassy_tooth.png"
                                alt="Encryption"
                                width={80}
                                height={75}
                                className="h-auto w-auto object-contain"
                                style={{ filter: "drop-shadow(0 0 10px rgba(146,205,253,0.3))" }}
                            />
                        </div>
                        <div className="relative z-10 flex h-full flex-col items-end justify-end pt-[100px]">
                            <p className="text-right font-poppins text-sm font-medium text-smile-primary dark:text-[#92CDFD]">Encryption</p>
                            <p className="max-w-[180px] text-right font-poppins text-xl font-bold leading-tight text-smile-title dark:text-white">
                                AES-256 Encrypted
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
