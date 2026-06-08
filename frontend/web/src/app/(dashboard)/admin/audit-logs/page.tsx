import type { Metadata } from "next";

import { AdminAuditLogsContent } from "./AdminAuditLogsContent";

export const metadata: Metadata = {
    title: "Audit Logs",
};

export default function AdminAuditLogsPage() {
    return <AdminAuditLogsContent />;
}
