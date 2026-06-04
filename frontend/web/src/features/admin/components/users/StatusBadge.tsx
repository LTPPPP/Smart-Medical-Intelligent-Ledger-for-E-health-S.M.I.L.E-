export function StatusBadge({ isBanned }: { isBanned: boolean }) {
    return isBanned ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-inter text-[10px] font-semibold text-red-600 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Banned
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-inter text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Active
        </span>
    );
}
