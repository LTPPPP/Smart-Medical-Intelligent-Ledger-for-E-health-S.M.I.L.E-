"use client";

import { useState, useEffect } from "react";

import Image from "next/image";

import { Icon } from "@iconify/react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { KycSubmit } from "@/features/profile/components/KycSubmit";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";

// Reusable styled card
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={"rounded-[24px] border p-6 backdrop-blur-md " + className}
            style={{
                background: "var(--surface-card-bg)",
                borderColor: "var(--surface-card-border)",
                boxShadow: "var(--surface-card-shadow)",
            }}
        >
            {children}
        </div>
    );
}

// Info field row (underline style)
function FieldRow({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="group">
            <p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">{label}</p>
            <div className="flex items-center gap-2 pb-2">
                <Icon icon={icon} width={15} className="shrink-0 text-smile-primary opacity-70" />
                <div className="flex-1">{children}</div>
            </div>
            <div
                className="h-px w-full transition-colors group-focus-within:bg-smile-primary"
                style={{ background: "var(--surface-panel-border)" }}
            />
        </div>
    );
}

// Info item (grid cards in read-only view)
function InfoItem({ label, value, icon }: { label: string; value?: string | null; icon: string }) {
    return (
        <div
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{
                background: "var(--surface-footer-bg)",
                borderColor: "var(--surface-panel-border)",
            }}
        >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-smile-primary-light">
                <Icon icon={icon} width={17} className="text-smile-primary" />
            </div>
            <div className="min-w-0">
                <p className="font-inter text-xs text-smile-description">{label}</p>
                <p className="mt-0.5 truncate font-poppins text-sm font-medium text-smile-primary-dark">{value || "—"}</p>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { updateProfile, isUpdatingProfile } = useAuth();

    const [activeTab, setActiveTab] = useState<"info" | "edit" | "password" | "kyc">("info");
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [profileForm, setProfileForm] = useState({
        fullName: "",
        dateOfBirth: "",
        gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
        address: "",
        avatarUrl: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                fullName: user.fullName || "",
                dateOfBirth: user.dateOfBirth || "",
                gender: (user.gender as "MALE" | "FEMALE" | "OTHER") || "MALE",
                address: "",
                avatarUrl: user.avatarUrl || "",
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                fullName: profileForm.fullName || undefined,
                dateOfBirth: profileForm.dateOfBirth || undefined,
                gender: profileForm.gender,
                address: profileForm.address || undefined,
                avatarUrl: profileForm.avatarUrl || undefined,
            });
            setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        } catch {
            setProfileMsg({ type: "error", text: "Failed to update profile. Please try again." });
        }
        setTimeout(() => setProfileMsg(null), 3000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordForm.newPassword) {
            setPasswordMsg({ type: "error", text: "Please enter a new password." });
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordMsg({ type: "error", text: "Password must be at least 8 characters." });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg({ type: "error", text: "Passwords do not match." });
            return;
        }
        try {
            await updateProfile({ password: passwordForm.newPassword });
            setPasswordMsg({ type: "success", text: "Password changed successfully!" });
            setPasswordForm({ newPassword: "", confirmPassword: "" });
        } catch {
            setPasswordMsg({ type: "error", text: "Failed to change password. Please try again." });
        }
        setTimeout(() => setPasswordMsg(null), 3000);
    };

    const tabs = [
        { id: "info", label: "Profile Info", icon: "lucide:user" },
        { id: "edit", label: "Edit Profile", icon: "lucide:pencil" },
        { id: "password", label: "Change Password", icon: "lucide:lock" },
        { id: "kyc", label: "Identity Verification", icon: "lucide:badge-check" },
    ] as const;

    return (
        <ProtectedRoute>
            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Animated liquid blobs (theme-aware) */}
                <div className="liquid-blob pointer-events-none absolute -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-blob-primary" />
                <div className="liquid-blob-slow pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-blob-secondary" />
                <div className="liquid-blob-fast pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blob-tertiary" />

                {/* Decorative images */}
                <div
                    className="pointer-events-none absolute -right-10 top-6 h-[220px] w-[190px] opacity-[0.10] dark:opacity-[0.05]"
                    style={{ transform: "matrix(-0.99,-0.13,-0.13,0.99,0,0)" }}
                >
                    <Image src="/images/glassy_tooth.png" alt="" fill className="object-contain" />
                </div>
                <div className="pointer-events-none absolute bottom-8 left-8 rotate-[20deg] opacity-[0.08] dark:opacity-[0.04]">
                    <Image src="/images/glassy_tool.png" alt="" width={120} height={135} className="object-contain" />
                </div>

                {/* ── Shared header (same as landing & dashboard) ── */}
                <LandingHeader />

                <div className="relative mx-auto max-w-5xl px-4 py-10">
                    {/* Page header */}
                    <div
                        className="mb-8 rounded-[28px] border px-8 py-6 backdrop-blur-md"
                        style={{
                            background: "var(--surface-panel-bg)",
                            borderColor: "var(--surface-panel-border)",
                            boxShadow: "var(--surface-panel-shadow)",
                        }}
                    >
                        <div>
                            <p className="mb-1 font-inter text-xs font-semibold uppercase tracking-[3px] text-smile-description">
                                Account
                            </p>
                            <h1 className="font-poppins text-3xl font-semibold text-smile-primary">My Profile</h1>
                            <p className="mt-1 font-inter text-sm text-smile-title">
                                Manage your personal information and settings
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {/* Left: Avatar sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="flex flex-col items-center gap-4 text-center">
                                {/* Avatar */}
                                <div className="relative">
                                    {user?.avatarUrl ? (
                                        <Image
                                            src={user.avatarUrl}
                                            alt={user.fullName || "Avatar"}
                                            width={96}
                                            height={96}
                                            className="h-24 w-24 rounded-full object-cover ring-4 ring-smile-primary/20 ring-offset-2 ring-offset-background"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-smile-primary-light to-smile-card-gradient-end ring-4 ring-smile-primary/15 ring-offset-2 ring-offset-background">
                                            <Icon icon="lucide:user" width={38} className="text-smile-primary" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        aria-label="Change avatar"
                                        onClick={() => setActiveTab("edit")}
                                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-smile-primary shadow-md transition-transform hover:scale-110"
                                    >
                                        <Icon icon="lucide:camera" width={13} className="text-white" />
                                    </button>
                                </div>

                                <div>
                                    <h2 className="font-poppins text-lg font-semibold text-smile-primary-dark">
                                        {user?.fullName || "—"}
                                    </h2>
                                    <p className="font-inter text-sm text-smile-description">@{user?.username}</p>
                                </div>

                                {/* Roles */}
                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {user?.status && (
                                        <span className={
                                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-inter text-[11px] font-semibold " +
                                            (user.status === "ACTIVE" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400")
                                        }>
                                            <Icon icon={user.status === "ACTIVE" ? "lucide:check-circle" : "lucide:circle"} width={10} />
                                            {user.status}
                                        </span>
                                    )}
                                    {user?.roles?.map(r => (
                                        <span key={r} className="inline-flex items-center gap-1 rounded-full bg-smile-primary-light px-2.5 py-1 font-inter text-[11px] font-semibold text-smile-primary">
                                            <Icon icon="lucide:crown" width={10} />
                                            {r.replace("ROLE_", "")}
                                        </span>
                                    ))}
                                </div>

                                {/* Verification */}
                                <div
                                    className="w-full space-y-2.5 border-t pt-4"
                                    style={{ borderColor: "var(--surface-panel-border)" }}
                                >
                                    {[
                                        { icon: "lucide:mail", label: "Email", verified: user?.emailVerified },
                                        { icon: "lucide:phone", label: "Phone", verified: user?.phoneVerified },
                                    ].map(({ icon, label, verified }) => (
                                        <div key={label} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-1.5 font-inter text-smile-title">
                                                <Icon icon={icon} width={13} />
                                                {label}
                                            </span>
                                            <span className={
                                                "flex items-center gap-1 font-semibold " +
                                                (verified ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")
                                            }>
                                                <Icon icon={verified ? "lucide:check-circle" : "lucide:alert-circle"} width={13} />
                                                {verified ? "Verified" : "Pending"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Right: Tabs + Content */}
                        <div className="lg:col-span-3">
                            {/* Tab nav */}
                            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={
                                            "flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-inter text-sm font-semibold transition-all " +
                                            (activeTab === tab.id
                                                ? "bg-smile-primary text-white shadow-[0_4px_20px_rgba(65,126,170,0.4)]"
                                                : "border text-smile-title hover:text-smile-primary")
                                        }
                                        style={activeTab !== tab.id ? {
                                            background: "var(--surface-panel-bg)",
                                            borderColor: "var(--surface-panel-border)",
                                        } : undefined}
                                    >
                                        <Icon icon={tab.icon} width={15} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* INFO TAB */}
                            {activeTab === "info" && (
                                <Card>
                                    <h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
                                        Account Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <InfoItem label="Full Name" value={user?.fullName} icon="lucide:user" />
                                        <InfoItem label="Username" value={user?.username ? "@" + user.username : undefined} icon="lucide:at-sign" />
                                        <InfoItem label="Email" value={user?.email} icon="lucide:mail" />
                                        <InfoItem label="Phone" value={user?.phone || "Not provided"} icon="lucide:phone" />
                                        <InfoItem label="Gender" value={user?.gender} icon="lucide:users" />
                                        <InfoItem label="Date of Birth" value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : undefined} icon="lucide:calendar" />
                                        <InfoItem label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : undefined} icon="lucide:clock" />
                                        <InfoItem label="Last Login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : undefined} icon="lucide:log-in" />
                                    </div>

                                    {/* Permissions */}
                                    {(user?.permissions?.length ?? 0) > 0 && (
                                        <div
                                            className="mt-5 rounded-xl border p-4"
                                            style={{
                                                background: "var(--surface-footer-bg)",
                                                borderColor: "var(--surface-panel-border)",
                                            }}
                                        >
                                            <p className="mb-2.5 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
                                                Permissions
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {user?.permissions?.map(p => (
                                                    <span
                                                        key={p}
                                                        className="inline-flex rounded-lg px-2.5 py-1 font-inter text-[11px] text-smile-description"
                                                        style={{ background: "var(--surface-panel-bg)" }}
                                                    >
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* EDIT TAB */}
                            {activeTab === "edit" && (
                                <Card>
                                    <h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
                                        Edit Profile
                                    </h3>

                                    {profileMsg && (
                                        <div className={
                                            "mb-4 flex items-center gap-2 rounded-xl px-4 py-3 font-inter text-sm " +
                                            (profileMsg.type === "success"
                                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                                : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400")
                                        }>
                                            <Icon icon={profileMsg.type === "success" ? "lucide:check-circle" : "lucide:alert-circle"} width={16} />
                                            {profileMsg.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                                        <FieldRow label="Full Name" icon="lucide:user">
                                            <input
                                                type="text"
                                                placeholder="Your full name"
                                                value={profileForm.fullName}
                                                onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                                className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
                                            />
                                        </FieldRow>

                                        <FieldRow label="Date of Birth" icon="lucide:calendar">
                                            <input
                                                type="date"
                                                value={profileForm.dateOfBirth}
                                                onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                                                className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </FieldRow>

                                        <div>
                                            <p className="mb-2.5 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
                                                Gender
                                            </p>
                                            <div className="flex gap-2.5">
                                                {(["MALE", "FEMALE", "OTHER"] as const).map(g => (
                                                    <label
                                                        key={g}
                                                        className={
                                                            "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-inter text-sm font-medium transition-all " +
                                                            (profileForm.gender === g
                                                                ? "border-smile-primary bg-smile-primary-light text-smile-primary"
                                                                : "text-smile-description hover:border-smile-primary/40 hover:text-smile-primary")
                                                        }
                                                        style={profileForm.gender !== g ? {
                                                            borderColor: "var(--surface-panel-border)",
                                                        } : undefined}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="gender"
                                                            value={g}
                                                            checked={profileForm.gender === g}
                                                            onChange={() => setProfileForm({ ...profileForm, gender: g })}
                                                            className="sr-only"
                                                        />
                                                        {g}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <FieldRow label="Address" icon="lucide:map-pin">
                                            <input
                                                type="text"
                                                placeholder="Your address (optional)"
                                                value={profileForm.address}
                                                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                                                className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
                                            />
                                        </FieldRow>

                                        <FieldRow label="Avatar URL" icon="lucide:image">
                                            <input
                                                type="url"
                                                placeholder="https://… (optional)"
                                                value={profileForm.avatarUrl}
                                                onChange={e => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                                                className="w-full bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
                                            />
                                        </FieldRow>

                                        <button
                                            type="submit"
                                            disabled={isUpdatingProfile}
                                            className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_20px_rgba(65,126,170,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isUpdatingProfile && <Icon icon="line-md:loading-twotone-loop" width={16} />}
                                            Save Changes
                                        </button>
                                    </form>
                                </Card>
                            )}

                            {/* KYC TAB */}
                            {activeTab === "kyc" && (
                                <Card>
                                    <h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
                                        Identity Verification (KYC)
                                    </h3>
                                    <KycSubmit />
                                </Card>
                            )}

                            {/* PASSWORD TAB */}
                            {activeTab === "password" && (
                                <Card>
                                    <h3 className="mb-5 font-poppins text-lg font-semibold text-smile-primary-dark">
                                        Change Password
                                    </h3>

                                    {passwordMsg && (
                                        <div className={
                                            "mb-4 flex items-center gap-2 rounded-xl px-4 py-3 font-inter text-sm " +
                                            (passwordMsg.type === "success"
                                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                                : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400")
                                        }>
                                            <Icon icon={passwordMsg.type === "success" ? "lucide:check-circle" : "lucide:alert-circle"} width={16} />
                                            {passwordMsg.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        {[
                                            { label: "New Password", key: "newPassword" as const, show: showNew, toggle: () => setShowNew(p => !p), ac: "new-password" },
                                            { label: "Confirm Password", key: "confirmPassword" as const, show: showConfirm, toggle: () => setShowConfirm(p => !p), ac: "new-password" },
                                        ].map(({ label, key, show, toggle, ac }) => (
                                            <FieldRow key={key} label={label} icon="lucide:lock">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type={show ? "text" : "password"}
                                                        autoComplete={ac}
                                                        placeholder="••••••••"
                                                        value={passwordForm[key]}
                                                        onChange={e => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                                                        className="flex-1 bg-transparent py-1 font-poppins text-sm text-smile-title outline-none placeholder:text-smile-description"
                                                    />
                                                    <button type="button" onClick={toggle} className="shrink-0 text-smile-description hover:text-smile-primary">
                                                        <Icon icon={show ? "lucide:eye-off" : "lucide:eye"} width={16} />
                                                    </button>
                                                </div>
                                            </FieldRow>
                                        ))}

                                        {/* Strength hints */}
                                        <div
                                            className="rounded-xl border p-4"
                                            style={{
                                                background: "var(--surface-footer-bg)",
                                                borderColor: "var(--surface-panel-border)",
                                            }}
                                        >
                                            <p className="mb-2 font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">
                                                Requirements
                                            </p>
                                            <ul className="space-y-1.5">
                                                {[
                                                    { test: passwordForm.newPassword.length >= 8, label: "At least 8 characters" },
                                                    { test: /[A-Z]/.test(passwordForm.newPassword), label: "One uppercase letter" },
                                                    { test: /[0-9]/.test(passwordForm.newPassword), label: "One number" },
                                                ].map(({ test, label }) => (
                                                    <li key={label} className={
                                                        "flex items-center gap-2 font-inter text-xs transition-colors " +
                                                        (test ? "text-green-600 dark:text-green-400" : "text-smile-description")
                                                    }>
                                                        <Icon icon={test ? "lucide:check-circle" : "lucide:circle"} width={13} />
                                                        {label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUpdatingProfile}
                                            className="flex w-full items-center justify-center gap-2 rounded-full bg-smile-primary py-3.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_20px_rgba(65,126,170,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isUpdatingProfile && <Icon icon="line-md:loading-twotone-loop" width={16} />}
                                            Change Password
                                        </button>
                                    </form>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
