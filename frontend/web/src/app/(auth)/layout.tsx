// ============================================================
// Auth layout — full-screen wrapper for login/register pages
// Each page manages its own decorative background elements
// ============================================================

import { PageTransition } from "@/components/shared/PageTransition";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#0d0d0d]">
            <PageTransition>
                {children}
            </PageTransition>
        </div>
    );
}
