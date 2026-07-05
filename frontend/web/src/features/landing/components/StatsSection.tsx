import { Icon } from "@iconify/react";

const stats = [
    { value: "800+", label: "Expert Dentists", icon: "lucide:users" },
    { value: "150,000+", label: "Analyzed Cases", icon: "lucide:scan-face" },
    { value: "98.5%", label: "Diagnosis Accuracy", icon: "lucide:brain" },
    { value: "24/7", label: "AI Smart Support", icon: "lucide:bot" },
] as const;

export function StatsSection() {
    return (
        <section className="px-4 py-14 md:px-6">
            <div className="mx-auto max-w-[1280px]">
                {/* Gradient divider */}
                <div className="mx-auto mb-14 max-w-[500px]">
                    <div
                        className="h-px"
                        style={{
                            background: "linear-gradient(90deg, transparent, var(--divider-accent), transparent)",
                        }}
                    />
                </div>

                {/* Stats grid */}
                <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-4 md:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="group relative overflow-hidden rounded-2xl p-5 text-center backdrop-blur-sm transition-all duration-300"
                            style={{
                                background: "var(--surface-panel-bg)",
                                border: "1px solid var(--surface-panel-border)",
                                boxShadow: "var(--surface-panel-shadow)",
                            }}
                        >
                            {/* Top shimmer */}
                            <div
                                className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent"
                            />
                            <Icon
                                icon={stat.icon}
                                width={22}
                                className="relative z-10 mx-auto mb-3 text-smile-primary dark:text-[#38BDF8]"
                            />
                            <p className="relative z-10 font-poppins text-2xl font-bold text-smile-primary dark:text-[#92CDFD]">
                                {stat.value}
                            </p>
                            <p className="relative z-10 mt-1.5 font-poppins text-xs text-smile-description dark:text-[#8B9199]">
                                {stat.label}
                            </p>
                            {/* Bottom glow line on hover */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                style={{
                                    background: "linear-gradient(90deg, transparent, var(--divider-accent), transparent)",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
