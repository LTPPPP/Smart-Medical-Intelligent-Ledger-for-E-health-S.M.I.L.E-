"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

interface NavItem {
	label: string;
	href: string;
	icon: string;
	requiredRoles?: string[];
	requiredPermissions?: string[];
}

export const AppNavigation = () => {
	const pathname = usePathname();
	const { user } = useAuthStore();
	const { logout } = useAuth();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => setMenuOpen(false), [pathname]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	if (!user) return null;

	const navItems: NavItem[] = [
		{
			label: "Dashboard",
			href: ROUTES.DASHBOARD,
			icon: "mdi:view-dashboard",
		},
		{
			label: "Appointments",
			href: ROUTES.APPOINTMENTS,
			icon: "mdi:calendar-clock",
			// requiredPermissions: ['APPOINTMENT_READ'],
		},
		// Services is hidden temporarily because the service feature module is not present in this branch.
		// {
		//   label: 'Services',
		//   href: ROUTES.SERVICES,
		//   icon: 'mdi:medical-bag',
		// },
		{
			label: "Specialties",
			href: ROUTES.SPECIALTIES,
			icon: "mdi:tag-multiple",
		},
		{
			label: "Clinics",
			href: ROUTES.CLINICS,
			icon: "mdi:hospital-building",
		},
		{
			label: "Admin",
			href: ROUTES.ADMIN,
			icon: "mdi:shield-crown",
			// requiredRoles: ['ROLE_ADMIN'],
		},
		{
			label: "Patients",
			href: ROUTES.PATIENTS,
			icon: "mdi:account-multiple",
			// requiredPermissions: ['MEDICAL_RECORD_READ'],
		},
		{
			label: "Doctors Schedule",
			href: ROUTES.DOCTOR_SCHEDULES,
			icon: "mdi:account-multiple",
		},
		{
			label: "Doctors Management",
			href: ROUTES.DOCTOR_LEAVES,
			icon: "mdi:account-multiple",
		},
	];

	const hasAccess = (item: NavItem) => {
		if (item.requiredRoles && item.requiredRoles.length > 0) {
			return item.requiredRoles.some((role) => user.roles.includes(role));
		}
		if (item.requiredPermissions && item.requiredPermissions.length > 0) {
			return item.requiredPermissions.some((permission) =>
				user.permissions.includes(permission),
			);
		}
		return true;
	};

	const filteredItems = navItems.filter(hasAccess);

	return (
		<nav className="sticky top-0 z-50 border-b border-smile-border bg-white/80 shadow-sm backdrop-blur-md">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
						<div className="w-9 h-9 bg-smile-primary rounded-xl flex items-center justify-center shadow-[0_4px_10px_rgba(65,126,170,0.35)]">
							<Icon icon="mdi:tooth" className="text-white" width={20} />
						</div>
						<span className="font-poppins font-semibold text-lg tracking-wide text-smile-primary-dark">
							S.M.I.L.E
						</span>
					</Link>

					{/* Nav Links */}
					<div className="hidden md:flex items-center gap-1">
						{filteredItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-1.5 px-3 py-2 rounded-lg font-inter text-sm font-medium transition-colors",
									pathname === item.href
										? "bg-smile-primary-light text-smile-primary"
										: "text-smile-title hover:bg-smile-footer-bg hover:text-smile-primary",
								)}
							>
								<Icon icon={item.icon} width={16} />
								{item.label}
							</Link>
						))}
					</div>

					{/* User Menu */}
					<div className="flex items-center gap-3">
						<NotificationBell />
						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setMenuOpen((v) => !v)}
								className="flex items-center gap-2 rounded-full border border-smile-border bg-white/70 px-3 py-1.5 hover:border-smile-primary hover:bg-smile-footer-bg transition-colors"
							>
								<div className="w-7 h-7 rounded-full bg-smile-primary flex items-center justify-center shadow-sm">
									<span className="text-white font-semibold text-xs">
										{user.fullName?.charAt(0).toUpperCase() || "?"}
									</span>
								</div>
								<span className="font-inter text-sm font-medium text-smile-title hidden sm:block">
									{user.fullName}
								</span>
								<Icon
									icon="lucide:chevron-down"
									width={14}
									className={cn(
										"text-smile-description hidden sm:block transition-transform",
										menuOpen && "rotate-180",
									)}
								/>
							</button>

							<AnimatePresence>
								{menuOpen && (
									<motion.div
										initial={{ opacity: 0, y: -6, scale: 0.97 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: -6, scale: 0.97 }}
										transition={{ duration: 0.14, ease: "easeOut" }}
										className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-smile-border bg-white shadow-xl"
									>
										<div className="p-1.5">
											<Link
												href={ROUTES.PROFILE}
												className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-inter text-sm text-smile-title transition-all hover:bg-smile-footer-bg hover:text-smile-primary"
											>
												<Icon
													icon="lucide:user-circle"
													width={16}
													className="shrink-0 text-smile-primary"
												/>
												Profile
											</Link>
										</div>
										<div className="mx-3 h-px bg-smile-border" />
										<div className="p-1.5">
											<button
												type="button"
												onClick={() => logout()}
												className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-inter text-sm text-red-500 transition-all hover:bg-red-50"
											>
												<Icon
													icon="lucide:log-out"
													width={16}
													className="shrink-0"
												/>
												Sign Out
											</button>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
};
