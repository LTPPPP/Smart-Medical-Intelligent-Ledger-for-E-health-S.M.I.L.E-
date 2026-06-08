// ============================================================
// FeaturesSection — Three feature cards
// Online Scheduling | Digital Health Records | Centralized Clinic Management
// ============================================================

import Image from "next/image";

import { ArrowButton } from "./ArrowButton";

const features = [
    {
        title: "Online Scheduling",
        image: "/images/landing/feature-scheduling.svg",
        imageWidth: 242,
        imageHeight: 186,
        imageAlt: "Online scheduling calendar",
    },
    {
        title: "Digital Health Records",
        image: "/images/landing/feature-records.svg",
        imageWidth: 195,
        imageHeight: 261,
        imageAlt: "Blockchain-secured digital health records",
    },
    {
        title: "Centralized Clinic Management",
        image: "/images/landing/feature-management.svg",
        imageWidth: 220,
        imageHeight: 234,
        imageAlt: "Clinic management dashboard",
    },
] as const;

export function FeaturesSection() {
    return (
        <section className="px-4 py-12 md:px-6">
            <div className="mx-auto grid max-w-[1280px] gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <div key={feature.title} className="group relative">
                        {/* Card */}
                        <div className="relative overflow-hidden rounded-[15px] border border-smile-primary bg-gradient-to-b from-white to-[#BAE3FF] dark:from-[#1a1a2e] dark:to-[#0f2a3a]">
                            {/* Arrow button */}
                            <div className="absolute right-4 top-4 z-10">
                                <ArrowButton size="lg" rotation={41.6} />
                            </div>

                            {/* Image area */}
                            <div className="flex h-[200px] items-center justify-center pt-4 md:h-[248px]">
                                <Image
                                    src={feature.image}
                                    alt={feature.imageAlt}
                                    width={feature.imageWidth}
                                    height={feature.imageHeight}
                                    className="max-h-full w-auto object-contain transition-transform group-hover:scale-105"
                                />
                            </div>
                        </div>

                        {/* Title below card */}
                        <h3 className="mt-4 text-right font-poppins text-xl font-medium text-smile-primary md:text-[25px] md:leading-[38px] dark:text-smile-primary-light/90">
                            {feature.title}
                        </h3>
                    </div>
                ))}
            </div>
        </section>
    );
}
