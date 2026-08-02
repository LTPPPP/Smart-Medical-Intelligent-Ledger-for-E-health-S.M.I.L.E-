"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { LanguageSwitcher } from "@/shared/components/common/LanguageSwitcher";
import {
	navForKind,
	resolveDashboardKind,
	type NavItem,
} from "@/shared/constants/nav";
import { ROUTES } from "@/shared/constants/routes";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";

function NavGroup({
	item,
	pathname,
	collapsed,
}: {
	item: NavItem;
	pathname: string;
	collapsed: boolean;
}) {
	const { t } = useTranslation();
	const children = item.children ?? [];
	const childActive = (href: string) =>
		href === item.href ? pathname === href : pathname.startsWith(href);
	const groupActive =
		pathname === item.href || pathname.startsWith(`${item.href}/`);
	const [open, setOpen] = useState(groupActive);
	const [popupOpen, setPopupOpen] = useState(false);
	const popupRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (groupActive) setOpen(true);
	}, [groupActive]);

	useEffect(() => {
		if (!popupOpen) return;
		const handleOutside = (e: MouseEvent) => {
			if (!popupRef.current?.contains(e.target as Node)) setPopupOpen(false);
		};
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setPopupOpen(false);
		};
		document.addEventListener("mousedown", handleOutside);
		window.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			window.removeEventListener("keydown", handleEscape);
		};
	}, [popupOpen]);

	if (collapsed) {
		return (
			<div ref={popupRef} className="relative">
				<button
					type="button"
					title={t(item.label)}
					onClick={() => setPopupOpen((v) => !v)}
					className={`group relative flex w-full items-center justify-center overflow-hidden rounded-xl px-3.5 py-2.5 font-inter text-sm transition-all ${
						groupActive
							? "bg-smile-primary font-semibold text-white shadow-[0_4px_14px_rgba(65,126,170,0.35)]"
							: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
					}`}
				>
					<Icon
						icon={item.icon}
						width={18}
						className={groupActive ? "text-white" : "text-smile-primary"}
					/>
				</button>

				<AnimatePresence>
					{popupOpen && (
						<motion.div
							initial={{ opacity: 0, x: -6 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -6 }}
							transition={{ duration: 0.15 }}
							className="absolute left-full top-0 z-50 ml-2 w-52 overflow-hidden rounded-xl border py-1.5 backdrop-blur-xl"
							style={{
								background: "var(--surface-card-bg)",
								borderColor: "var(--surface-card-border)",
								boxShadow: "var(--surface-card-shadow)",
							}}
						>
							<p className="px-3 pb-1.5 pt-1 font-inter text-[11px] font-semibold uppercase tracking-wide text-smile-description">
								{t(item.label)}
							</p>
							{children.map((child) => {
								const active = childActive(child.href);
								return (
									<Link
										key={child.href}
										href={child.href}
										onClick={() => setPopupOpen(false)}
										className={`mx-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-inter text-[13px] transition-all ${
											active
												? "bg-smile-primary font-semibold text-white"
												: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
										}`}
									>
										<Icon
											icon={child.icon}
											width={15}
											className={active ? "text-white" : "text-smile-primary"}
										/>
										<span>{t(child.label)}</span>
									</Link>
								);
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-left font-inter text-sm transition-all ${
					groupActive
						? "font-semibold text-smile-primary"
						: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
				}`}
			>
				<Icon
					icon={item.icon}
					width={18}
					className="relative shrink-0 text-smile-primary"
				/>
				<span className="relative flex-1">{t(item.label)}</span>
				<Icon
					icon="lucide:chevron-down"
					width={15}
					className={`relative shrink-0 text-smile-description transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div
							className="ml-4 mt-1 flex flex-col gap-0.5 border-l pl-3"
							style={{ borderColor: "var(--surface-card-border)" }}
						>
							{children.map((child) => {
								const active = childActive(child.href);
								return (
									<Link
										key={child.href}
										href={child.href}
										className={`group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 font-inter text-[13px] transition-all ${
											active
												? "bg-smile-primary font-semibold text-white shadow-[0_3px_12px_rgba(65,126,170,0.3)]"
												: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
										}`}
									>
										<Icon
											icon={child.icon}
											width={15}
											className={
												active
													? "relative text-white"
													: "relative text-smile-primary"
											}
										/>
										<span className="relative">{t(child.label)}</span>
									</Link>
								);
							})}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const { t } = useTranslation();
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const [confirmingLogout, setConfirmingLogout] = useState(false);
	const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const accountMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => setMounted(true), []);
	usePushNotifications(Boolean(user));
	useEffect(() => setMobileOpen(false), [pathname]);
	useEffect(() => setAccountMenuOpen(false), [pathname]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				accountMenuRef.current &&
				!accountMenuRef.current.contains(e.target as Node)
			) {
				setAccountMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const kind = resolveDashboardKind(user?.roles);
	const nav = navForKind(kind);

	const initials = (user?.fullName || user?.email || "U")
		.split(" ")
		.map((p) => p[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	const isActive = (href: string) => {
		if (href === ROUTES.DASHBOARD) return pathname === href;
		if (href === ROUTES.ADMIN) {
			return pathname === ROUTES.ADMIN ||
				pathname.startsWith(`${ROUTES.ADMIN}/`)
				? !nav.some(
						(n) =>
							n.href !== ROUTES.ADMIN &&
							n.href !== ROUTES.DASHBOARD &&
							pathname.startsWith(n.href),
					)
				: false;
		}
		return pathname.startsWith(href);
	};

	const handleSignOut = () => {
		if (confirmingLogout) {
			logout();
			router.push(ROUTES.LOGIN);
		} else {
			setConfirmingLogout(true);
			if (logoutTimer.current) clearTimeout(logoutTimer.current);
			logoutTimer.current = setTimeout(() => setConfirmingLogout(false), 3000);
		}
	};

	const renderSidebarBody = (
		isCollapsed: boolean,
		showMenuToggle: boolean,
		showProfilePopup: boolean,
	) => (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pr-1">
				{/* Logo */}
				<Link
					href={ROUTES.HOME}
					className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`}
				>
					<Image
						src="/images/logo.png"
						alt="S.M.I.L.E"
						width={38}
						height={38}
						priority
					/>
					{!isCollapsed && (
						<span className="flex flex-col leading-tight">
							<span className="font-poppins text-xl font-semibold tracking-[2px] text-smile-primary dark:text-[#92CDFD]">
								S.M.I.L.E
							</span>
							<span className="font-inter text-[10px] uppercase tracking-[1.5px] text-smile-description">
								Dental Platform
							</span>
						</span>
					)}
				</Link>

				{showMenuToggle && (
					<button
						type="button"
						onClick={() => setCollapsed((v) => !v)}
						title={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
						aria-label={
							isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")
						}
						className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/60 hover:text-smile-primary ${isCollapsed ? "justify-center" : ""}`}
					>
						<Icon
							icon="lucide:menu"
							width={18}
							className="shrink-0 text-smile-primary"
						/>
						{!isCollapsed && <span>{t("sidebar.menu")}</span>}
					</button>
				)}

				{/* Nav */}
				<nav className="flex flex-col gap-1">
					{nav.map((item) =>
						item.children?.length ? (
							<NavGroup
								key={item.href}
								item={item}
								pathname={pathname}
								collapsed={isCollapsed}
							/>
						) : (
							<Link
								key={item.href}
								href={item.href}
								title={isCollapsed ? t(item.label) : undefined}
								className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 font-inter text-sm transition-all ${isCollapsed ? "justify-center" : ""} ${
									isActive(item.href)
										? "bg-smile-primary font-semibold text-white shadow-[0_4px_14px_rgba(65,126,170,0.35)]"
										: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
								}`}
							>
								{isActive(item.href) && (
									<div
										className="pointer-events-none absolute inset-0 rounded-xl"
										style={{
											background:
												"linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
										}}
									/>
								)}
								<Icon
									icon={item.icon}
									width={18}
									className={
										isActive(item.href)
											? "relative text-white"
											: "relative text-smile-primary"
									}
								/>
								{!isCollapsed && (
									<span className="relative">{t(item.label)}</span>
								)}
								{isActive(item.href) && !isCollapsed && (
									<span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/80" />
								)}
							</Link>
						),
					)}
				</nav>
			</div>

			{/* Bottom */}
			<div
				className="flex shrink-0 flex-col gap-1 border-t pt-4"
				style={{ borderColor: "var(--surface-card-border)" }}
			>
				{showProfilePopup ? (
					<div className="relative" ref={accountMenuRef}>
						<button
							type="button"
							onClick={() => setAccountMenuOpen((v) => !v)}
							title={isCollapsed ? t("header.profile") : undefined}
							className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/60 hover:text-smile-primary ${isCollapsed ? "justify-center" : ""}`}
						>
							<Icon
								icon="lucide:user-circle"
								width={18}
								className="shrink-0 text-smile-primary"
							/>
							{!isCollapsed && (
								<span className="flex-1">{t("header.profile")}</span>
							)}
						</button>

						<AnimatePresence>
							{accountMenuOpen && (
								<motion.div
									initial={{ opacity: 0, y: 6, scale: 0.97 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 6, scale: 0.97 }}
									transition={{ duration: 0.14, ease: "easeOut" }}
									className="absolute bottom-full left-0 z-10 mb-2 w-64 overflow-hidden rounded-2xl border shadow-xl backdrop-blur-2xl"
									style={{
										background: "var(--surface-card-bg)",
										borderColor: "var(--surface-card-border)",
										boxShadow: "var(--surface-card-shadow)",
									}}
								>
									<div className="flex items-center gap-3 p-3">
										{user?.avatarUrl ? (
											<Image
												src={user.avatarUrl}
												alt={user.fullName || "Avatar"}
												width={36}
												height={36}
												className="h-9 w-9 shrink-0 rounded-full object-cover"
												unoptimized
											/>
										) : (
											<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-smile-primary text-xs font-semibold text-white">
												{initials}
											</span>
										)}
										<div className="min-w-0 flex-1">
											<p className="truncate font-inter text-sm font-semibold text-smile-title">
												{user?.fullName ?? "Account"}
											</p>
											<p className="truncate font-inter text-xs text-smile-description">
												{user?.email}
											</p>
										</div>
									</div>
									<div
										className="mx-3 h-px"
										style={{ background: "var(--surface-panel-border)" }}
									/>
									<div className="p-1.5">
										<Link
											href={ROUTES.PROFILE}
											className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/60 hover:text-smile-primary"
										>
											<Icon
												icon="lucide:user-circle"
												width={16}
												className="shrink-0 text-smile-primary"
											/>
											{t("profile.viewProfile")}
										</Link>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				) : (
					<Link
						href={ROUTES.PROFILE}
						className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/60 hover:text-smile-primary"
					>
						<Icon
							icon="lucide:user-circle"
							width={18}
							className="text-smile-primary"
						/>
						{t("header.profile")}
					</Link>
				)}
				<button
					onClick={handleSignOut}
					title={isCollapsed ? t("header.signOut") : undefined}
					className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-inter text-sm transition-all ${isCollapsed ? "justify-center" : ""} ${
						confirmingLogout
							? "bg-red-100 text-red-600 dark:bg-red-950/40"
							: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
					}`}
				>
					<Icon
						icon={confirmingLogout ? "lucide:alert-triangle" : "lucide:log-out"}
						width={18}
					/>
					{!isCollapsed &&
						(confirmingLogout
							? t("header.confirmSignOut")
							: t("header.signOut"))}
				</button>
			</div>
		</div>
	);

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-background">
			{/* Liquid blobs (theme-aware via CSS vars) */}
			<div className="liquid-blob pointer-events-none fixed -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-blob-primary" />
			<div className="liquid-blob-slow pointer-events-none fixed -right-32 top-32 h-96 w-96 rounded-full bg-blob-secondary" />
			<div className="liquid-blob-fast pointer-events-none fixed bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blob-tertiary" />

			{/* ── Sidebar (desktop) ── */}
			<aside
				className={`fixed left-0 top-0 z-30 hidden h-screen flex-col border-r backdrop-blur-md transition-all duration-200 lg:flex ${
					collapsed ? "w-20 p-4" : "w-72 p-6"
				}`}
				style={{
					background: "var(--surface-nav-bg)",
					borderColor: "var(--surface-nav-border)",
				}}
			>
				{renderSidebarBody(collapsed, true, true)}
			</aside>

			{/* ── Mobile drawer ── */}
			<AnimatePresence>
				{mobileOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setMobileOpen(false)}
							className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
						/>
						<motion.aside
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "tween", duration: 0.22 }}
							className="fixed left-0 top-0 z-50 h-screen w-72 border-r p-6 backdrop-blur-md lg:hidden"
							style={{
								background: "var(--surface-nav-bg)",
								borderColor: "var(--surface-nav-border)",
							}}
						>
							{renderSidebarBody(false, false, false)}
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* ── Topbar ── */}
			<header
				className={`fixed left-0 top-0 z-20 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md transition-all duration-200 sm:px-8 ${
					collapsed
						? "lg:left-20 lg:w-[calc(100%-5rem)]"
						: "lg:left-72 lg:w-[calc(100%-18rem)]"
				}`}
				style={{
					background: "var(--surface-nav-bg)",
					borderColor: "var(--surface-nav-border)",
				}}
			>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setMobileOpen(true)}
						className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary lg:hidden"
						aria-label={t("header.openMenu")}
					>
						<Icon icon="lucide:menu" width={20} />
					</button>
					<div className="relative hidden sm:block">
						<Icon
							icon="lucide:search"
							width={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
						/>
						<input
							placeholder={t("common.searchPlaceholder")}
							className="h-[38px] w-56 rounded-full border px-4 pl-10 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/40 lg:w-64"
							style={{
								background: "var(--surface-input-bg)",
								borderColor: "var(--surface-input-border)",
							}}
						/>
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					<LanguageSwitcher />
					{mounted && (
						<button
							type="button"
							onClick={() =>
								setTheme(resolvedTheme === "dark" ? "light" : "dark")
							}
							className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary"
							aria-label={t("header.toggleTheme")}
						>
							<Icon
								icon={resolvedTheme === "dark" ? "lucide:sun" : "lucide:moon"}
								width={18}
							/>
						</button>
					)}
					<NotificationBell />
				</div>
			</header>

			{/* ── Content ── */}
			<div
				className={`relative z-10 transition-all duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}
			>
				<div className="pt-16">{children}</div>
			</div>
		</div>
	);
}

export default AppShell;
