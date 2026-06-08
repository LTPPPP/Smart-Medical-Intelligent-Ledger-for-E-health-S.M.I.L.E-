// ============================================================
// WorkflowSection — Patient-to-Doctor 3-step workflow
// 01 Identity Verification → 02 Smart Match & Booking → 03 Clinical Examination
// ============================================================

import { GradientText } from "./GradientText";

const steps = [
    {
        number: "01",
        title: "Identity Verification",
        description:
            "Patients sign up via OTP and complete eKYC (ID & Selfie) to create a trusted, verified medical profile.",
    },
    {
        number: "02",
        title: "Smart Match & Booking",
        description:
            "Utilize the AI Chatbot or Smart Booking engine to find the right specialist based on symptoms and real-time availability.",
    },
    {
        number: "03",
        title: "Clinical Examination",
        description:
            "Direct connection at the clinic where doctors perform an Examination Session assisted by AI analysis for the final treatment plan.",
    },
] as const;

export function WorkflowSection() {
    return (
        <section className="px-4 py-12 md:px-6">
            <div className="mx-auto max-w-[1280px]">
                {/* Section title */}
                <div className="mb-12 flex justify-center">
                    <GradientText
                        as="h2"
                        className="text-center font-poppins text-3xl font-semibold md:text-[50px] md:leading-[75px]"
                    >
                        The Patient-to-Doctor Workflow
                    </GradientText>
                </div>

                {/* Steps grid */}
                <div className="relative grid gap-8 md:grid-cols-3 md:gap-4">
                    {/* Connecting lines (desktop only) */}
                    <div className="pointer-events-none absolute left-[calc(16.67%+34px)] right-[calc(16.67%+34px)] top-[34px] hidden h-px bg-smile-primary md:block" />

                    {steps.map((step) => (
                        <div key={step.number} className="flex flex-col items-center text-center">
                            {/* Number circle */}
                            <div className="relative z-10 flex h-[69px] w-[69px] items-center justify-center rounded-full bg-gradient-to-bl from-[#F9FDFF] to-[#BAE3FF] dark:from-[#1a1a2e] dark:to-[#0f2a3a]">
                                <span className="font-poppins text-[40px] font-semibold leading-[60px] text-smile-primary">
                                    {step.number}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="mt-6 font-poppins text-xl font-semibold text-smile-primary dark:text-smile-primary-light/90">
                                {step.title}
                            </h3>

                            {/* Description */}
                            <p className="mt-4 max-w-[296px] font-poppins text-xs leading-[18px] text-smile-description">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
