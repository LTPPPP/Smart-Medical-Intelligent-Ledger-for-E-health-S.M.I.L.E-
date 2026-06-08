"use client";

import { useTranslation } from "@/hooks";

export function AdminAuditLogsContent() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{t("common.page.adminAuditLogs.title", "Audit Logs")}</h1>
                <p className="text-sm text-muted-foreground">{t("common.page.adminAuditLogs.description", "System audit trail and activity logs.")}</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
                <p className="text-sm text-muted-foreground">{t("common.page.adminAuditLogs.empty", "Audit log entries will appear here.")}</p>
            </div>
        </div>
    );
}
