"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@iconify/react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useTranslation } from "@/features/i18n";
import { cn } from "@/shared/lib/utils";

import {
	useNotifications,
	useUnreadCount,
	useMarkRead,
} from "../hooks/useNotifications";
import type { Notification } from "../types/notification.type";

const isUnread = (n: Notification) => !n.readAt && n.status !== "read";

const formatRelativeTime = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	try {
		return formatDistanceToNow(date, { addSuffix: true });
	} catch {
		return "";
	}
};

export function NotificationBell() {
	const { user } = useAuthStore();
	const { t } = useTranslation();
	const userId = user?.userId ?? null;

	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const { data: notifications, isLoading } = useNotifications(userId, {
		page: 1,
		limit: 10,
	});
	const { data: unreadCount } = useUnreadCount(userId);
	const { mutate: markRead } = useMarkRead();

	// Close Dropdown
	useEffect(() => {
		if (!open) return;
		const handleClick = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	if (!userId) return null;

	const items = notifications ?? [];
	const badgeCount = unreadCount ?? 0;

	const handleItemClick = (notification: Notification) => {
		if (isUnread(notification)) {
			markRead(notification.notificationId);
		}
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				aria-label={t("header.notifications")}
				onClick={() => setOpen((prev) => !prev)}
				className={cn(
					"relative rounded-full p-2 text-smile-description transition-all hover:bg-smile-primary-light/40 hover:text-smile-primary",
					open && "bg-smile-primary-light/40 text-smile-primary",
				)}
			>
				<Icon icon="lucide:bell" width={18} />
				{badgeCount > 0 && (
					<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
						{badgeCount > 99 ? "99+" : badgeCount}
					</span>
				)}
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.15 }}
						className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-smile-border shadow-lg [background:var(--surface-card-bg)]"
					>
						<div className="flex items-center justify-between border-b border-smile-border px-4 py-3">
							<span className="font-poppins text-sm font-semibold text-smile-title">
								{t("header.notifications")}
							</span>
							{badgeCount > 0 && (
								<span className="rounded-full bg-smile-primary-light px-2 py-0.5 text-xs font-medium text-smile-primary">
									{badgeCount} {t("header.new")}
								</span>
							)}
						</div>

						<div className="max-h-96 overflow-y-auto">
							{isLoading ? (
								<div className="px-4 py-8 text-center text-sm text-smile-description">
									{t("common.loading")}
								</div>
							) : items.length === 0 ? (
								<div className="px-4 py-8 text-center text-sm text-smile-description">
									{t("header.noNotifications")}
								</div>
							) : (
								items.map((notification) => {
									const unread = isUnread(notification);
									return (
										<button
											key={notification.notificationId}
											type="button"
											onClick={() => handleItemClick(notification)}
											className={cn(
												"flex w-full gap-3 border-b border-smile-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-smile-footer-bg",
												unread && "bg-smile-primary-light/40",
											)}
										>
											<span
												className={cn(
													"mt-1.5 h-2 w-2 shrink-0 rounded-full",
													unread ? "bg-smile-primary" : "bg-transparent",
												)}
											/>
											<div className="min-w-0 flex-1">
												{notification.subject && (
													<p className="truncate font-inter text-sm font-semibold text-smile-title">
														{notification.subject}
													</p>
												)}
												<p className="font-inter text-sm text-smile-description line-clamp-2">
													{notification.message}
												</p>
												<p className="mt-1 font-inter text-xs text-smile-description/70">
													{formatRelativeTime(
														notification.createdAt ?? notification.scheduledAt,
													)}
												</p>
											</div>
										</button>
									);
								})
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
