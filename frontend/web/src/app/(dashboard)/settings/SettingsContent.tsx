"use client";

import { useTranslation } from "@/hooks";

export function SettingsContent() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{t("common.page.settings.title", "Settings")}</h1>
                <p className="text-sm text-muted-foreground">{t("common.page.settings.description", "Manage your account and preferences.")}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
                <p className="text-sm text-muted-foreground">{t("common.page.settings.empty", "Settings and preferences will appear here.")}</p>
            </div>
        </div>
    );
}
