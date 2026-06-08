// ============================================================
// SearchBar — Hero search bar with green send button
// Client component for interactive input
// ============================================================

"use client";

import { ArrowButton } from "./ArrowButton";

export function SearchBar() {
    return (
        <div className="flex items-center gap-2 rounded-full border-[0.5px] border-smile-border bg-white/65 px-5 py-2 dark:border-white/10 dark:bg-black/30">
            <input
                type="text"
                placeholder="How can we help your smile today?"
                className="flex-1 bg-transparent font-poppins text-sm text-foreground outline-none placeholder:text-muted-foreground dark:text-gray-200 dark:placeholder:text-gray-500"
                aria-label="Search dental services"
            />
            <ArrowButton size="sm" rotation={90} />
        </div>
    );
}
