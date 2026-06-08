"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from "lucide-react";
import { useTranslation } from "@/hooks";

type Strength = "weak" | "fair" | "strong";

function getStrength(pwd: string): Strength {
    if (pwd.length === 0) return "weak";
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return "weak";
    if (score <= 2) return "fair";
    return "strong";
}

const STRENGTH_LABEL: Record<Strength, string> = {
    weak: "Weak",
    fair: "Fair",
    strong: "Strong",
};
const STRENGTH_COLOR: Record<Strength, string> = {
    weak: "#FFB4AB",
    fair: "#FCD34D",
    strong: "#45F0CF",
};

function PasswordInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="flex flex-col gap-2">
            <label
                className="pl-1 text-sm font-medium text-muted-foreground dark:text-[#C1C7CF]"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
                {label}
            </label>
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-xl border bg-transparent px-4 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring dark:border-white/[0.1] dark:bg-black/20 dark:text-white dark:placeholder:text-[#323538] dark:focus:border-white/25"
                    style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.28px" }}
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground dark:text-[#94A3B8] dark:hover:text-white"
                >
                    {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
            </div>
        </div>
    );
}

function StrengthMeter({ password }: { password: string }) {
    const strength = getStrength(password);
    const bars = ["weak", "fair", "strong"] as Strength[];
    const activeIndex = bars.indexOf(strength);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                {bars.map((b, i) => (
                    <div
                        key={b}
                        className="h-1.5 flex-1 rounded-full transition-colors"
                        style={{
                            background: i <= activeIndex ? STRENGTH_COLOR[strength] : "rgba(128,128,128,0.15)",
                        }}
                    />
                ))}
            </div>
            <div className="flex justify-between px-1">
                <span
                    className="text-[10px] uppercase tracking-[0.5px]"
                    style={{ fontFamily: "var(--font-space-grotesk)", color: STRENGTH_COLOR[strength] }}
                >
                    {password ? STRENGTH_LABEL[strength] : ""}
                </span>
                <span
                    className="text-[10px] uppercase tracking-[0.5px] text-muted-foreground/60 dark:text-[#64748B]"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                    {password ? "Use 8+ chars, numbers & symbols" : ""}
                </span>
            </div>
        </div>
    );
}

export function ChangePassword({ onCancel }: { onCancel?: () => void }) {
    const [current, setCurrent] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const { t } = useTranslation();

    const mismatch = confirm.length > 0 && newPwd !== confirm;

    return (
        <div className="flex items-center justify-center py-10">
            {/* Ambient orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div
                    className="absolute rounded-full dark:bg-[rgba(146,205,253,0.05)]"
                    style={{
                        left: "25%",
                        right: "36%",
                        top: "25%",
                        bottom: "25%",
                        filter: "blur(32px)",
                    }}
                />
                <div
                    className="absolute rounded-full dark:bg-[rgba(69,240,207,0.05)]"
                    style={{
                        left: "36%",
                        right: "25%",
                        top: "25%",
                        bottom: "25%",
                        filter: "blur(32px)",
                    }}
                />
            </div>

            {/* Glass card */}
            <div
                className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-[24px] border bg-card text-card-foreground shadow-sm dark:border-white/[0.1] dark:bg-[rgba(15,23,42,0.6)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:backdrop-blur-[12px]"
            >
                {/* Top gradient bar */}
                <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{
                        background: "linear-gradient(90deg, #5B96C4 0%, #00D3B3 50%, #5B96C4 100%)",
                        opacity: 0.5,
                    }}
                />

                {/* Header */}
                <div className="border-b px-8 py-8 dark:border-white/[0.1]">
                    <div className="flex items-center gap-4">
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted dark:text-[#94A3B8] dark:hover:bg-white/[0.05] dark:hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        <h2
                            className="text-3xl font-semibold text-foreground dark:text-white"
                            style={{ fontFamily: "var(--font-public-sans)", letterSpacing: "-0.32px" }}
                        >
                            {t("profile.changePasswordTitle", "Change Password")}
                        </h2>
                    </div>
                    <p
                        className="mt-2 text-base text-muted-foreground dark:text-[#C1C7CF]"
                        style={{ fontFamily: "var(--font-public-sans)" }}
                    >
                        {t("profile.changePasswordSubtitle", "Keep your account protected with a strong password.")}
                    </p>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6 px-8 py-8">
                    {/* Current Password */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="pl-1 text-sm font-medium text-muted-foreground dark:text-[#C1C7CF]"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                            {t("profile.currentPassword", "Current Password")}
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                                className="h-11 w-full rounded-xl border bg-transparent px-4 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring dark:border-white/[0.1] dark:bg-black/20 dark:text-white dark:placeholder:text-[#323538] dark:focus:border-white/25"
                                style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: current ? "2px" : "0.28px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground dark:text-[#94A3B8] dark:hover:text-white"
                            >
                                {showCurrent ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(128,128,128,0.15) 50%,rgba(255,255,255,0) 100%)" }} />

                    {/* New Password + Strength */}
                    <div className="flex flex-col gap-3">
                        <PasswordInput
                            label={t("profile.newPassword", "New Password")}
                            value={newPwd}
                            onChange={setNewPwd}
                            placeholder="Enter new password"
                        />
                        {newPwd && <StrengthMeter password={newPwd} />}
                    </div>

                    {/* Confirm */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="pl-1 text-sm font-medium text-muted-foreground dark:text-[#C1C7CF]"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                            {t("profile.confirmPassword", "Confirm New Password")}
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter new password"
                            className="h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors focus:border-ring dark:bg-black/20 dark:text-white dark:placeholder:text-[#323538] dark:focus:border-white/25"
                            style={{
                                fontFamily: "var(--font-space-grotesk)",
                                letterSpacing: "0.28px",
                                borderColor: mismatch ? "rgba(255,100,100,0.4)" : undefined,
                            }}
                        />
                        {mismatch && (
                            <p className="pl-1 text-xs text-[#FFB4AB]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                                Passwords do not match
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 px-8 pb-8 pt-0">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="rounded-full border px-6 py-2.5 text-sm font-medium text-foreground transition-colors dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                            {t("common.cancel", "Cancel")}
                        </button>
                    )}
                    <button
                        disabled={!current || !newPwd || mismatch || newPwd.length < 8}
                        className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            background: "#5B96C4",
                            fontFamily: "var(--font-space-grotesk)",
                        }}
                    >
                        <Shield className="h-[15px] w-[15px]" />
                        {t("profile.updatePassword", "Update Password")}
                    </button>
                </div>
            </div>
        </div>
    );
}