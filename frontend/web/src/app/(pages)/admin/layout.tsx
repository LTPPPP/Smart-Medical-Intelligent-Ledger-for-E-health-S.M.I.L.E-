"use client";

import { AppShell } from "@/shared/components/layout/AppShell";

// Admin navigation now lives in the main sidebar (Admin Panel → submenu), so
// these pages just need the standard app shell — no nested admin sidebar.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
