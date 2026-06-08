// ============================================================
// TestContent — client component with translated page header
// ============================================================

"use client";

import { useTranslation } from "@/hooks";
import { ConnectionTestPanel } from "@/components/test/ConnectionTestPanel";

export function TestContent() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{t("common.page.test.title", "System Connection Test")}</h1>
                <p className="text-sm text-muted-foreground">{t("common.page.test.description", "Test connectivity between Frontend and Backend API, load data from database, and monitor performance metrics.")}</p>
            </div>
            <ConnectionTestPanel />
        </div>
    );
}
