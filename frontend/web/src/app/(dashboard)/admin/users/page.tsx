import type { Metadata } from "next";

import { AdminUsersContent } from "./AdminUsersContent";

export const metadata: Metadata = {
    title: "User Management",
};

export default function AdminUsersPage() {
    return <AdminUsersContent />;
}
