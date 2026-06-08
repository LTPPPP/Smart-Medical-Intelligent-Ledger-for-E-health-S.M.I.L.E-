// Next.js built-in loading UI — shown during server-side data fetching
// Shown automatically while a page segment is loading

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            <LoadingSkeleton />
        </div>
    );
}
