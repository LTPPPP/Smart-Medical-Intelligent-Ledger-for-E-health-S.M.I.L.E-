"use client";

import { useTranslation } from "@/hooks";

export function AdminUsersContent() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{t("common.page.adminUsers.title", "User Management")}</h1>
                <p className="text-sm text-muted-foreground">{t("common.page.adminUsers.description", "Manage staff accounts, roles, and permissions.")}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
                <p className="text-sm text-muted-foreground">{t("common.page.adminUsers.empty", "User management interface will appear here.")}</p>
            </div>
        </div>
    );
}
