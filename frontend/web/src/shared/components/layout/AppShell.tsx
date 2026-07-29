"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

import { useAuthStore } from "@/features/auth/store/authStore";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import {
	navForKind,
	resolveDashboardKind,
	type NavItem,
} from "@/shared/constants/nav";
import { ROUTES } from "@/shared/constants/routes";

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "smile-sidebar-collapsed";

function NavGroup({
	item,
	pathname,
	collapsed = false,
	onExpand,
}: {
	item: NavItem;
	pathname: string;
	collapsed?: boolean;
	onExpand?: () => void;
}) {
	const children = item.children ?? [];
	const childActive = (href: string) =>
		href === item.href ? pathname === href : pathname.startsWith(href);
	const groupActive =
		pathname === item.href || pathname.startsWith(`${item.href}/`);
	const [open, setOpen] = useState(groupActive);

	useEffect(() => {
		if (groupActive) setOpen(true);
	}, [groupActive]);

	return (
		<div className="flex flex-col">
			<button
				type="button"
				onClick={() => {
					if (collapsed) {
						setOpen(true);
						onExpand?.();
						return;
					}
					setOpen((value) => !value);
				}}
				aria-label={collapsed ? item.label : undefined}
				aria-expanded={!collapsed && open}
				title={collapsed ? item.label : undefined}
				className={`group relative flex items-center overflow-hidden rounded-xl text-left font-inter text-sm transition-all ${
					collapsed ? "h-11 justify-center px-0 py-0" : "gap-3 px-3.5 py-2.5"
				} ${
					groupActive
						? collapsed
							? "bg-smile-primary-light/70 font-semibold text-smile-primary"
							: "font-semibold text-smile-primary"
						: "text-smile-title hover:bg-smile-primary-light/60 hover:text-smile-primary"
				}`}
			>
				<Icon
					icon={item.icon}
					width={collapsed ? 20 : 18}
					className="relative shrink-0 text-smile-primary"
				/>
				{!collapsed && (
					<>
						<span className="relative flex-1">{item.label}</span>
						<Icon
							icon="lucide:chevron-down"
							width={15}
							className={`relative shrink-0 text-smile-description transition-transform ${open ? "rotate-180" : ""}`}
						/>
					</>
				)}
			</button>

			<AnimatePresence initial={false}>
				{!collapsed && open && (
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
										<span className="relative">{child.label}</span>
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
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const [confirmingLogout, setConfirmingLogout] = useState(false);
	const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const accountMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
		try {
			setSidebarCollapsed(
				window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true",
			);
		} catch {
			// Storage can be unavailable in restricted browser contexts.
		}
	}, []);
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

	const updateSidebarCollapsed = (collapsed: boolean) => {
		setSidebarCollapsed(collapsed);
		try {
			window.localStorage.setItem(
				SIDEBAR_COLLAPSED_STORAGE_KEY,
				String(collapsed),
			);
		} catch {
			// The UI remains usable even when persistence is blocked.
		}
	};

	const renderSidebarBody = (collapsed: boolean) => (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${
					collapsed ? "gap-5 pr-0" : "gap-7 pr-1"
				}`}
			>
				{/* Logo */}
				<Link
					href={ROUTES.HOME}
					aria-label="S.M.I.L.E home"
					title={collapsed ? "S.M.I.L.E home" : undefined}
					className={`flex items-center ${
						collapsed ? "justify-center" : "gap-2.5"
					}`}
				>
					<Image
						src="/images/logo.png"
						alt="S.M.I.L.E"
						width={38}
						height={38}
						priority
					/>
					{!collapsed && (
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

				{/* Primary action */}
				<Link
					href={ROUTES.APPOINTMENT_NEW}
					aria-label="New Booking"
					title={collapsed ? "New Booking" : undefined}
					className={`flex items-center justify-center rounded-full bg-smile-primary font-poppins text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition-all hover:bg-smile-primary-dark hover:shadow-[0_6px_24px_rgba(65,126,170,0.5)] active:scale-[0.98] ${
						collapsed ? "mx-auto h-11 w-11 p-0" : "gap-2 px-4 py-3"
					}`}
				>
					<Icon icon="lucide:plus" width={collapsed ? 20 : 16} />
					{!collapsed && <span>New Booking</span>}
				</Link>

				{/* Nav */}
				<nav className="flex flex-col gap-1">
					{nav.map((item) =>
						item.children?.length ? (
							<NavGroup
								key={item.href}
								item={item}
								pathname={pathname}
								collapsed={collapsed}
								onExpand={() => updateSidebarCollapsed(false)}
							/>
						) : (
							<Link
								key={item.href}
								href={item.href}
								aria-label={collapsed ? item.label : undefined}
								title={collapsed ? item.label : undefined}
								className={`group relative flex items-center overflow-hidden rounded-xl font-inter text-sm transition-all ${
									collapsed
										? "h-11 justify-center px-0 py-0"
										: "gap-3 px-3.5 py-2.5"
								} ${
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
									width={collapsed ? 20 : 18}
									className={
										isActive(item.href)
											? "relative text-white"
											: "relative text-smile-primary"
									}
								/>
								{!collapsed && <span className="relative">{item.label}</span>}
								{isActive(item.href) && (
									<span
										className={`absolute h-1.5 w-1.5 rounded-full bg-white/80 ${
											collapsed ? "right-1.5" : "right-3"
										}`}
									/>
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
				<Link
					href={ROUTES.PROFILE}
					aria-label={collapsed ? "Profile" : undefined}
					title={collapsed ? "Profile" : undefined}
					className={`flex items-center rounded-xl font-inter text-sm text-smile-title transition-all hover:bg-smile-primary-light/60 hover:text-smile-primary ${
						collapsed ? "h-11 justify-center px-0 py-0" : "gap-3 px-3.5 py-2.5"
					}`}
				>
					<Icon
						icon="lucide:user-circle"
						width={collapsed ? 20 : 18}
						className="text-smile-primary"
					/>
					{!collapsed && <span>Profile</span>}
				</Link>
				<button
					type="button"
					onClick={handleSignOut}
					aria-label={
						collapsed
							? confirmingLogout
								? "Click again to confirm sign out"
								: "Sign Out"
							: undefined
					}
					title={
						collapsed
							? confirmingLogout
								? "Click again to confirm sign out"
								: "Sign Out"
							: undefined
					}
					className={`flex items-center rounded-xl text-left font-inter text-sm transition-all ${
						collapsed ? "h-11 justify-center px-0 py-0" : "gap-3 px-3.5 py-2.5"
					} ${
						confirmingLogout
							? "bg-red-100 text-red-600 dark:bg-red-950/40"
							: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
					}`}
				>
					<Icon
						icon={confirmingLogout ? "lucide:alert-triangle" : "lucide:log-out"}
						width={collapsed ? 20 : 18}
					/>
					{!collapsed && (
						<span>
							{confirmingLogout ? "Click again to confirm" : "Sign Out"}
						</span>
					)}
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
				id="app-sidebar-desktop"
				data-testid="desktop-sidebar"
				className={`fixed left-0 top-0 z-30 hidden h-screen flex-col border-r backdrop-blur-md transition-[width,padding] duration-200 ease-out lg:flex ${
					sidebarCollapsed ? "w-20 px-3 py-6" : "w-72 p-6"
				}`}
				style={{
					background: "var(--surface-nav-bg)",
					borderColor: "var(--surface-nav-border)",
				}}
			>
				{renderSidebarBody(sidebarCollapsed)}
				<button
					type="button"
					onClick={() => updateSidebarCollapsed(!sidebarCollapsed)}
					aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					aria-controls="app-sidebar-desktop"
					aria-expanded={!sidebarCollapsed}
					title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					className="absolute -right-3.5 top-20 z-40 flex h-7 w-7 items-center justify-center rounded-full border text-smile-primary shadow-sm transition-colors hover:border-smile-primary/50 hover:bg-smile-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-smile-primary/40"
					style={{
						background: "var(--surface-card-bg)",
						borderColor: "var(--surface-card-border)",
					}}
				>
					<Icon
						icon={
							sidebarCollapsed ? "lucide:chevron-right" : "lucide:chevron-left"
						}
						width={16}
					/>
				</button>
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
							data-testid="mobile-sidebar"
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
							{renderSidebarBody(false)}
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* ── Topbar ── */}
			<header
				className={`fixed left-0 top-0 z-20 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md transition-[left,width] duration-200 ease-out sm:px-8 ${
					sidebarCollapsed
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
						aria-label="Open menu"
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
							placeholder="Search patients, files..."
							className="h-[38px] w-56 rounded-full border px-4 pl-10 font-inter text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/40 lg:w-64"
							style={{
								background: "var(--surface-input-bg)",
								borderColor: "var(--surface-input-border)",
							}}
						/>
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					{mounted && (
						<button
							type="button"
							onClick={() =>
								setTheme(resolvedTheme === "dark" ? "light" : "dark")
							}
							className="rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary"
							aria-label="Toggle theme"
						>
							<Icon
								icon={resolvedTheme === "dark" ? "lucide:sun" : "lucide:moon"}
								width={18}
							/>
						</button>
					)}
					<NotificationBell />
					<div className="relative" ref={accountMenuRef}>
						<button
							type="button"
							onClick={() => setAccountMenuOpen((v) => !v)}
							className="flex h-9 items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-all hover:border-smile-primary/40"
							style={{
								background: "var(--surface-card-bg)",
								borderColor: "var(--surface-card-border)",
							}}
						>
							{user?.avatarUrl ? (
								<Image
									src={user.avatarUrl}
									alt={user.fullName || "Avatar"}
									width={28}
									height={28}
									className="h-7 w-7 rounded-full object-cover"
									unoptimized
								/>
							) : (
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-smile-primary text-xs font-semibold text-white">
									{initials}
								</span>
							)}
							<span className="hidden font-inter text-sm font-medium text-smile-title sm:block">
								{user?.fullName?.split(" ")[0] ?? "Account"}
							</span>
							<Icon
								icon="lucide:chevron-down"
								width={13}
								className={`hidden text-smile-description transition-transform duration-200 sm:block ${accountMenuOpen ? "rotate-180" : ""}`}
							/>
						</button>

						<AnimatePresence>
							{accountMenuOpen && (
								<motion.div
									initial={{ opacity: 0, y: -6, scale: 0.97 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -6, scale: 0.97 }}
									transition={{ duration: 0.14, ease: "easeOut" }}
									className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border shadow-xl backdrop-blur-2xl"
									style={{
										background: "var(--surface-card-bg)",
										borderColor: "var(--surface-card-border)",
										boxShadow: "var(--surface-card-shadow)",
									}}
								>
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
											Profile
										</Link>
									</div>
									<div
										className="mx-3 h-px"
										style={{ background: "var(--surface-panel-border)" }}
									/>
									<div className="p-1.5">
										<button
											type="button"
											onClick={handleSignOut}
											className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-inter text-sm transition-all ${
												confirmingLogout
													? "bg-red-100 text-red-600 dark:bg-red-950/40"
													: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
											}`}
										>
											<Icon
												icon={
													confirmingLogout
														? "lucide:alert-triangle"
														: "lucide:log-out"
												}
												width={16}
												className="shrink-0"
											/>
											{confirmingLogout ? "Click again to confirm" : "Sign Out"}
										</button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</header>

			{/* ── Content ── */}
			<div
				data-testid="app-shell-content"
				className={`relative z-10 transition-[padding-left] duration-200 ease-out ${
					sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
				}`}
			>
				<div className="pt-16">{children}</div>
			</div>
		</div>
	);
}

export default AppShell;
