"use client";

import { Icon } from "@iconify/react";

import { cardBase } from "@/features/reports/components/ReportPrimitives";

import type { RoomType, Service } from "../types/service.type";

interface ServiceCardProps {
	service: Service;
	onEdit?: () => void;
	onDelete?: () => void;
	canManage?: boolean;
	isDeleting?: boolean;
}

const ROOM_LABELS: Record<RoomType, string> = {
	examination: "Examination room",
	surgery: "Surgery room",
	imaging: "Imaging room",
};

export function ServiceCard({
	service,
	onEdit,
	onDelete,
	canManage = false,
	isDeleting = false,
}: ServiceCardProps) {
	const formatPrice = (price: number | null, currency: string) => {
		if (price === null) return "Price on request";
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency,
			maximumFractionDigits: currency === "VND" ? 0 : 2,
		}).format(price);
	};

	return (
		<article className={`${cardBase} flex min-h-[280px] flex-col p-5`}>
			<div className="flex items-start gap-4">
				<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-smile-primary [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
					<Icon icon="mdi:tooth-outline" width={22} />
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h2 className="font-poppins text-lg font-semibold leading-snug text-smile-title">
								{service.serviceName}
							</h2>
							<p className="mt-1 font-mono text-xs font-semibold text-smile-description">
								{service.serviceCode}
							</p>
						</div>
						<span
							className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
								service.isActive
									? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
									: "text-smile-description [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]"
							}`}
						>
							{service.isActive ? "Active" : "Inactive"}
						</span>
					</div>
				</div>
			</div>

			<p className="mt-4 min-h-10 text-sm leading-6 text-smile-description">
				{service.description || "No description provided."}
			</p>

			<div className="mt-4 grid grid-cols-1 gap-2.5 text-sm text-smile-description sm:grid-cols-2">
				<p className="flex items-center gap-2">
					<Icon
						icon="mdi:clock-outline"
						width={17}
						className="shrink-0 text-smile-primary"
					/>
					{service.durationMinutes} minutes
				</p>
				<p className="flex items-center gap-2">
					<Icon
						icon="mdi:door"
						width={17}
						className="shrink-0 text-smile-primary"
					/>
					{ROOM_LABELS[service.requiredRoomType]}
				</p>
				<p className="flex items-center gap-2">
					<Icon
						icon="mdi:medical-bag"
						width={17}
						className="shrink-0 text-smile-primary"
					/>
					{service.specialty?.specialtyName || "No specialty"}
				</p>
				<p className="flex items-center gap-2">
					<Icon
						icon={
							service.requiresAppointment
								? "mdi:calendar-check"
								: "mdi:calendar-blank-outline"
						}
						width={17}
						className="shrink-0 text-smile-primary"
					/>
					{service.requiresAppointment
						? "Appointment required"
						: "Walk-in available"}
				</p>
			</div>

			<div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4 [border-color:var(--surface-panel-border)]">
				<p className="font-poppins text-base font-semibold text-smile-primary-dark">
					{formatPrice(service.basePrice, service.currency)}
				</p>

				{canManage && (
					<div className="flex items-center gap-2">
						{onEdit && (
							<button
								type="button"
								onClick={onEdit}
								disabled={isDeleting}
								className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary disabled:opacity-50 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]"
							>
								<Icon icon="mdi:pencil-outline" width={15} />
								Edit
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={onDelete}
								disabled={isDeleting}
								className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-sm font-semibold text-red-600 transition hover:border-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
							>
								<Icon
									icon={
										isDeleting
											? "line-md:loading-twotone-loop"
											: "mdi:trash-can-outline"
									}
									width={15}
								/>
								{isDeleting ? "Deleting…" : "Delete"}
							</button>
						)}
					</div>
				)}
			</div>
		</article>
	);
}
