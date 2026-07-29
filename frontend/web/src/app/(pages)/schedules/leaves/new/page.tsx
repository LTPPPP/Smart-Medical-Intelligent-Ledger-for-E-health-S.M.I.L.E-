"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Icon } from "@iconify/react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
	PageHeader,
	cardBase,
} from "@/features/reports/components/ReportPrimitives";
import { useSchedule } from "@/features/schedule/hooks/useSchedule";
import { AppShell } from "@/shared/components/layout/AppShell";
import { ROUTES } from "@/shared/constants/routes";
import { toast } from "@/shared/lib/toast";

const LEAVE_TYPES = [
	{ value: "annual", label: "Annual" },
	{ value: "sick", label: "Sick" },
	{ value: "emergency", label: "Emergency" },
];

export default function NewLeaveRequestPage() {
	const router = useRouter();
	const { user } = useAuthStore();
	const { createLeave, isCreatingLeave } = useSchedule();

	const [leaveType, setLeaveType] = useState("annual");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!user?.userId) {
			setError("You must be signed in to request leave.");
			return;
		}
		if (!startDate || !endDate) {
			setError("Start date and end date are required.");
			return;
		}
		if (endDate < startDate) {
			setError("End date cannot be before start date.");
			return;
		}

		try {
			await createLeave({
				doctorId: user.userId,
				leaveType,
				startDate,
				endDate,
				reason: reason.trim() || undefined,
			});
			toast.success("Leave request submitted");
			router.push(ROUTES.DOCTOR_LEAVES);
		} catch (err) {
			toast.apiError(err, "Failed to submit leave request");
		}
	};

	return (
		<AppShell>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
				<PageHeader
					eyebrow="Leave Management"
					title="Request Leave"
					subtitle="Submit a dated leave request for approval."
					icon="mdi:calendar-plus"
				/>
				<form
					onSubmit={handleSubmit}
					className={`${cardBase} space-y-5 p-6 sm:p-8`}
				>
					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-semibold text-slate-700 mb-1.5">
							Leave type
						</label>
						<select
							value={leaveType}
							onChange={(e) => setLeaveType(e.target.value)}
							className="h-11 w-full rounded-xl border px-3.5 text-sm text-smile-title outline-none focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						>
							{LEAVE_TYPES.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-1.5">
								Start date
							</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								required
								className="h-11 w-full rounded-xl border px-3.5 text-sm text-smile-title outline-none focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-1.5">
								End date
							</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								required
								className="h-11 w-full rounded-xl border px-3.5 text-sm text-smile-title outline-none focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-semibold text-slate-700 mb-1.5">
							Reason (optional)
						</label>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
							placeholder="Brief reason for the leave request"
							className="w-full rounded-xl border px-3.5 py-2.5 text-sm text-smile-title outline-none focus:border-smile-primary [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]"
						/>
					</div>

					<div className="flex items-center justify-end gap-3 pt-2">
						<Link
							href={ROUTES.DOCTOR_LEAVES}
							className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={isCreatingLeave}
							className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-smile-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-smile-primary-dark disabled:opacity-50"
						>
							{isCreatingLeave && (
								<Icon icon="line-md:loading-twotone-loop" width={16} />
							)}
							Submit Request
						</button>
					</div>
				</form>
			</div>
		</AppShell>
	);
}
