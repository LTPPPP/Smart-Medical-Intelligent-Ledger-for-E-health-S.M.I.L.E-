// ============================================================
// StatsSection — Four key statistics row
// 800+ Expert Dentists | 150,000+ Analyzed Cases |
// 98.5% Diagnosis Accuracy | 24/7 AI Smart Support
// ============================================================

const stats = [
    { value: "800+", label: "Expert Dentists" },
    { value: "150,000+", label: "Analyzed Cases" },
    { value: "98.5%", label: "Diagnosis Accuracy" },
    { value: "24/7", label: "AI Smart Support" },
] as const;

export function StatsSection() {
    return (
        <section className="px-4 py-6 md:px-6">
            <div className="mx-auto max-w-[1280px]">
                {/* Divider line */}
                <div className="mx-auto mb-8 h-px max-w-[472px] bg-smile-primary" />

                {/* Stats grid */}
                <div className="mx-auto grid max-w-[600px] grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="font-poppins text-xl font-semibold text-smile-primary">
                                {stat.value}
                            </p>
                            <p className="font-poppins text-xs text-smile-description">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
