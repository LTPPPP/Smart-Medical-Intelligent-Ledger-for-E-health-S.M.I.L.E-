// ============================================================
// Header — top bar with user avatar, theme toggle, notifications
// ============================================================

"use client";

import { Bell, LogOut, User as UserIcon } from "lucide-react";

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { MobileSidebar } from "@/components/shared/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useTranslation } from "@/hooks";
import { useUser } from "@/stores";

export function Header() {
    const user = useUser();
    const { logout, isLogoutPending } = useAuth();
    const { t } = useTranslation();

    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
        : "?";

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <MobileSidebar />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" aria-label={t("header.notifications", "Notifications")}>
                    <Bell className="h-4 w-4" />
                </Button>

                {/* Language switcher */}
                <LanguageSwitcher />

                {/* Theme toggle */}
                <ThemeToggle />

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={(props) => (
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full" {...props}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={user?.avatar ?? undefined}
                                        alt={user?.firstName ?? "User"}
                                    />
                                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        )}
                    />
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <UserIcon className="mr-2 h-4 w-4" />
                            {t("header.profile", "Profile")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => logout()}
                            disabled={isLogoutPending}
                            className="text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {t("header.logout", "Log out")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
