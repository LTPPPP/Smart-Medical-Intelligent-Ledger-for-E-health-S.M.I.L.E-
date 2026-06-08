// ============================================================
// LanguageSwitcher — compact locale toggle for the Header
// ============================================================

"use client";

import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/config/i18n";
import { cn } from "@/lib/utils";
import { useLocale, useSetLocale } from "@/stores/useLocaleStore";

export function LanguageSwitcher() {
    const locale = useLocale();
    const setLocale = useSetLocale();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={(props) => (
                    <Button variant="ghost" size="icon" aria-label="Change language" {...props}>
                        <Globe className="h-4 w-4" />
                    </Button>
                )}
            />
            <DropdownMenuContent align="end">
                {SUPPORTED_LOCALES.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => setLocale(loc as Locale)}
                        className={cn(locale === loc && "bg-accent font-medium")}
                    >
                        {LOCALE_LABELS[loc]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
