"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ViewProfile } from "@/components/profile/ViewProfile";
import { EditProfile } from "@/components/profile/EditProfile";
import { ChangePassword } from "@/components/profile/ChangePassword";
import { useTranslation } from "@/hooks";

type Tab = "view" | "edit" | "password";

const TABS: { id: Tab; labelKey: string; fallback: string }[] = [
    { id: "view", labelKey: "profile.viewProfile", fallback: "My Profile" },
    { id: "edit", labelKey: "profile.editProfile", fallback: "Edit Profile" },
    { id: "password", labelKey: "profile.changePassword", fallback: "Change Password" },
];

export default function ProfilePage() {
    const [tab, setTab] = useState<Tab>("view");
    const { t } = useTranslation();

    return (
        <div className="relative -m-4 min-h-full p-8 md:-m-6 md:p-10 dark:[background:radial-gradient(93.94%_117.43%_at_15%_50%,rgba(91,150,196,0.08)_0%,rgba(91,150,196,0)_25%),radial-gradient(101.79%_127.24%_at_85%_30%,rgba(0,211,179,0.05)_0%,rgba(0,211,179,0)_25%),linear-gradient(0deg,#111416,#111416)]">
            {/* ── Page Header ───────────────────────────────── */}
            <div className="mb-6">
                <h1
                    className="text-[32px] font-semibold leading-[42px] text-foreground dark:text-[#E1E2E6]"
                    style={{ fontFamily: "var(--font-public-sans)", letterSpacing: "-0.32px" }}
                >
                    {tab === "view" ? t("profile.title", "My Profile") : tab === "edit" ? t("profile.editProfile", "Edit Profile") : t("profile.changePasswordTitle", "Change Password")}
                </h1>
                <p
                    className="mt-1 text-base text-muted-foreground dark:text-[#C1C7CF]"
                    style={{ fontFamily: "var(--font-public-sans)" }}
                >
                    {tab === "view"
                        ? t("profile.viewDescription", "Manage your clinical identity and credentials.")
                        : tab === "edit"
                            ? t("profile.editDescription", "Update your clinical personnel record and system preferences.")
                            : t("profile.passwordDescription", "Secure your account with a new password.")}
                </p>
            </div>

            {/* ── Tab Bar ───────────────────────────────────── */}
            <div className="mb-8 flex w-fit gap-1 rounded-xl border p-1 border-border dark:border-white/[0.08] dark:bg-black/20">
                {TABS.map(({ id, labelKey, fallback }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="relative rounded-lg px-5 py-2 text-sm font-medium transition-colors"
                        style={{
                            fontFamily: "var(--font-space-grotesk)",
                            color: tab === id ? "#92CDFD" : "var(--muted-foreground)",
                        }}
                    >
                        {tab === id && (
                            <motion.span
                                layoutId="profile-tab-bg"
                                className="absolute inset-0 rounded-lg"
                                style={{
                                    background: "rgba(146,205,253,0.15)",
                                    borderRight: "2px solid #92CDFD",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{t(labelKey, fallback)}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab Content ──────────────────────────────── */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 16, scale: 0.99 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -16, scale: 0.99 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                    {tab === "view" && (
                        <ViewProfile onEdit={() => setTab("edit")} />
                    )}
                    {tab === "edit" && (
                        <EditProfile
                            onCancel={() => setTab("view")}
                            onSave={() => setTab("view")}
                        />
                    )}
                    {tab === "password" && (
                        <ChangePassword onCancel={() => setTab("view")} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
