// ============================================================
// Sidebar — responsive, collapsible, role-aware navigation
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronLeft, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { getNavigationForRole } from "@/config/navigation";
import { useTranslation } from "@/hooks";
import { cn } from "@/lib/utils";
import { useUserRole, useSidebarStore, useSidebarCollapsed } from "@/stores";
import type { NavItem } from "@/types";

function NavLink({
    item,
    isActive,
    isCollapsed,
}: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
}) {
    const Icon = item.icon;
    const { t } = useTranslation();
    const label = item.i18nKey ? t(item.i18nKey, item.title) : item.title;
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? label : undefined}
        >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {!isCollapsed && <span>{label}</span>}
            {!isCollapsed && item.badge && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

function SidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
    const pathname = usePathname();
    const role = useUserRole();
    const navItems = role ? getNavigationForRole(role) : [];

    return (
        <ScrollArea className="flex-1 py-2">
            <nav className="flex flex-col gap-1 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>
        </ScrollArea>
    );
}

/** Desktop sidebar */
export function Sidebar() {
    const isCollapsed = useSidebarCollapsed();
    const { toggleCollapse } = useSidebarStore();
    const { t } = useTranslation();

    return (
        <aside
            className={cn(
                "hidden h-screen flex-col border-r bg-sidebar transition-all duration-300 md:flex",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex h-14 items-center border-b px-4">
                {!isCollapsed && (
                    <Link
                        href="/"
                        className="text-lg font-bold tracking-tight hover:opacity-75 transition-opacity"
                        title="Go to home"
                    >
                        S.M.I.L.E
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("ml-auto h-8 w-8", isCollapsed && "mx-auto")}
                    onClick={toggleCollapse}
                    aria-label={isCollapsed ? t("sidebar.expand", "Expand sidebar") : t("sidebar.collapse", "Collapse sidebar")}
                >
                    {isCollapsed ? (
                        <Menu className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <SidebarContent isCollapsed={isCollapsed} />

            {/* Footer */}
            <Separator />
            <div className="p-2">
                {!isCollapsed && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                        © 2026 S.M.I.L.E
                    </p>
                )}
            </div>
        </aside>
    );
}

/** Mobile sidebar (sheet overlay) */
export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger
                render={(props) => (
                    <Button variant="ghost" size="icon" className="md:hidden" {...props}>
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation</span>
                    </Button>
                )}
            />
            <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="flex h-14 items-center border-b px-4">
                    <SheetTitle className="text-lg font-bold">
                        <Link href="/" className="hover:opacity-75 transition-opacity" title="Go to home">
                            S.M.I.L.E
                        </Link>
                    </SheetTitle>
                </SheetHeader>
                <SidebarContent isCollapsed={false} />
            </SheetContent>
        </Sheet>
    );
}
