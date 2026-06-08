// ============================================================
// DashboardContent — client component with translations
// ============================================================

"use client";

import { useTranslation } from "@/hooks";

export function DashboardContent() {
    const { t } = useTranslation();

    const stats = [
        { key: "todayAppointments", value: "—" },
        { key: "activePatients", value: "—" },
        { key: "pendingPayments", value: "—" },
        { key: "recordsVerified", value: "—" },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("dashboard.title", "Dashboard")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("dashboard.description", "Welcome to S.M.I.L.E — your dental practice overview.")}
                    </p>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.key}
                        className="rounded-lg border bg-card p-6 text-card-foreground"
                    >
                        <p className="text-sm font-medium text-muted-foreground">
                            {t(`dashboard.${stat.key}`, stat.key)}
                        </p>
                        <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Content placeholder */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">
                        {t("dashboard.upcomingAppointments", "Upcoming Appointments")}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t("dashboard.noUpcomingAppointments", "No upcoming appointments.")}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">
                        {t("dashboard.recentActivity", "Recent Activity")}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t("dashboard.noRecentActivity", "No recent activity.")}
                    </p>
                </div>
            </div>
        </div>
    );
}
