"use client";

import { useTranslation } from "@/hooks";

export function AdminClinicsContent() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{t("common.page.adminClinics.title", "Clinic Management")}</h1>
                <p className="text-sm text-muted-foreground">{t("common.page.adminClinics.description", "Manage clinics, treatment rooms, and equipment.")}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
                <p className="text-sm text-muted-foreground">{t("common.page.adminClinics.empty", "Clinic management interface will appear here.")}</p>
            </div>
        </div>
    );
}
