"use client";

import { Icon } from "@iconify/react";

import { usePatient } from "../hooks/usePatient";
import type { TreatmentHistory } from "../types/patient.type";

interface TreatmentHistoryTimelineProps {
	patientId: string;
}

export function TreatmentHistoryTimeline({
	patientId,
}: TreatmentHistoryTimelineProps) {
	const { useTreatmentHistory } = usePatient();
	const { data, isLoading, error } = useTreatmentHistory(patientId);
	const treatments: TreatmentHistory[] = data?.data ?? [];

	if (isLoading) {
		return (
			<div className="space-y-0">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="relative pl-6 pb-5 border-l-2 border-slate-200 last:border-transparent animate-pulse"
					>
						<span className="absolute left-[-9px] top-0.5 w-4 h-4 rounded-full bg-slate-200 ring-4 ring-white" />
						<div className="bg-white rounded-2xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] p-4">
							<div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
							<div className="h-3 bg-slate-100 rounded w-2/3" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
				<Icon
					icon="mdi:alert-circle"
					width={40}
					className="text-red-400 mx-auto mb-2"
				/>
				<p className="text-red-700 text-sm">Failed to load treatment history</p>
			</div>
		);
	}

	if (treatments.length === 0) {
		return (
			<div className="flex flex-col items-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400">
				<Icon
					icon="mdi:tooth-outline"
					width={48}
					className="mb-3 text-slate-300"
				/>
				<p className="text-sm">No treatment history yet</p>
			</div>
		);
	}

	const sorted = [...treatments].sort(
		(a, b) =>
			new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime(),
	);

	return (
		<div>
			{/* Section label */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-bold text-slate-900">Treatment History</h3>
				<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
					{treatments.length}
				</span>
			</div>

			{/* Vertical timeline */}
			<div className="space-y-0">
				{sorted.map((treatment, idx) => {
					const isFirst = idx === 0;
					return (
						<div
							key={treatment.id}
							className="relative pl-6 pb-5 border-l-2 border-slate-200 last:border-transparent"
						>
							{/* Timeline dot */}
							<span
								className={`absolute left-[-9px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white ${
									isFirst ? "bg-teal-600" : "bg-slate-300"
								}`}
							/>

							{/* Content card */}
							<div className="bg-white rounded-2xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<p className="font-bold text-slate-800 text-sm">
											{treatment.procedure}
										</p>

										{treatment.toothNumber !== undefined && (
											<span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 mt-1">
												Tooth #{treatment.toothNumber}
											</span>
										)}

										{treatment.description && (
											<p className="text-xs text-slate-500 mt-1.5">
												{treatment.description}
											</p>
										)}

										<p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
											<Icon icon="mdi:calendar" width={12} />
											{new Date(treatment.treatmentDate).toLocaleDateString(
												"vi-VN",
											)}
											{treatment.doctorName && (
												<>
													<span className="mx-0.5">·</span>
													<Icon icon="mdi:doctor" width={12} />
													{treatment.doctorName}
												</>
											)}
										</p>
									</div>

									{treatment.cost !== undefined && (
										<div className="text-right flex-none">
											<p className="text-sm font-bold text-emerald-600">
												{treatment.cost.toLocaleString("vi-VN")} VND
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
