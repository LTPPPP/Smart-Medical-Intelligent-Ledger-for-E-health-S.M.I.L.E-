"use client";

import { useState } from "react";

const ADULT_TEETH = [
	// Upper right (FDI 11-18)
	{ id: "18", label: "18", quadrant: "UR" },
	{ id: "17", label: "17", quadrant: "UR" },
	{ id: "16", label: "16", quadrant: "UR" },
	{ id: "15", label: "15", quadrant: "UR" },
	{ id: "14", label: "14", quadrant: "UR" },
	{ id: "13", label: "13", quadrant: "UR" },
	{ id: "12", label: "12", quadrant: "UR" },
	{ id: "11", label: "11", quadrant: "UR" },
	// Upper left (FDI 21-28)
	{ id: "21", label: "21", quadrant: "UL" },
	{ id: "22", label: "22", quadrant: "UL" },
	{ id: "23", label: "23", quadrant: "UL" },
	{ id: "24", label: "24", quadrant: "UL" },
	{ id: "25", label: "25", quadrant: "UL" },
	{ id: "26", label: "26", quadrant: "UL" },
	{ id: "27", label: "27", quadrant: "UL" },
	{ id: "28", label: "28", quadrant: "UL" },
	// Lower left (FDI 31-38)
	{ id: "38", label: "38", quadrant: "LL" },
	{ id: "37", label: "37", quadrant: "LL" },
	{ id: "36", label: "36", quadrant: "LL" },
	{ id: "35", label: "35", quadrant: "LL" },
	{ id: "34", label: "34", quadrant: "LL" },
	{ id: "33", label: "33", quadrant: "LL" },
	{ id: "32", label: "32", quadrant: "LL" },
	{ id: "31", label: "31", quadrant: "LL" },
	// Lower right (FDI 41-48)
	{ id: "41", label: "41", quadrant: "LR" },
	{ id: "42", label: "42", quadrant: "LR" },
	{ id: "43", label: "43", quadrant: "LR" },
	{ id: "44", label: "44", quadrant: "LR" },
	{ id: "45", label: "45", quadrant: "LR" },
	{ id: "46", label: "46", quadrant: "LR" },
	{ id: "47", label: "47", quadrant: "LR" },
	{ id: "48", label: "48", quadrant: "LR" },
];

interface ToothStatus {
	toothId: string;
	status: "healthy" | "cavity" | "filled" | "missing" | "crown" | "implant";
	notes?: string;
}

interface DentalChartProps {
	patientId: string;
	toothStatuses?: ToothStatus[];
	onToothSelect?: (toothId: string) => void;
	readOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
	healthy: "bg-white border-slate-300",
	cavity: "bg-red-100 border-red-400",
	filled: "bg-blue-100 border-blue-400",
	missing: "bg-slate-200 border-slate-400 opacity-50",
	crown: "bg-yellow-100 border-yellow-400",
	implant: "bg-purple-100 border-purple-400",
};

export function DentalChart({
	toothStatuses = [],
	onToothSelect,
	readOnly = false,
}: DentalChartProps) {
	const [selectedTooth, setSelectedTooth] = useState<string | null>(null);

	const getToothStatus = (toothId: string): ToothStatus => {
		return (
			toothStatuses.find((t) => t.toothId === toothId) || {
				toothId,
				status: "healthy",
			}
		);
	};

	const handleToothClick = (toothId: string) => {
		if (readOnly) return;
		setSelectedTooth(toothId);
		onToothSelect?.(toothId);
	};

	const upperTeeth = ADULT_TEETH.filter((t) =>
		["UR", "UL"].includes(t.quadrant),
	);
	const lowerTeeth = ADULT_TEETH.filter((t) =>
		["LL", "LR"].includes(t.quadrant),
	);

	const renderRow = (teeth: typeof ADULT_TEETH) => (
		<div className="flex justify-center gap-1">
			{teeth.map((tooth) => {
				const status = getToothStatus(tooth.id);
				const isSelected = selectedTooth === tooth.id;
				return (
					<button
						key={tooth.id}
						onClick={() => handleToothClick(tooth.id)}
						disabled={readOnly}
						className={`
              w-9 h-10 rounded-md border-2 text-xs font-medium transition-all
              ${STATUS_COLORS[status.status]}
              ${isSelected ? "ring-2 ring-teal-500 ring-offset-1" : ""}
              ${!readOnly ? "hover:ring-2 hover:ring-teal-300 cursor-pointer" : "cursor-default"}
            `}
						title={`Tooth ${tooth.label}: ${status.status}`}
					>
						{tooth.label}
					</button>
				);
			})}
		</div>
	);

	return (
		<div className="p-4 bg-white rounded-xl border">
			<h3 className="text-sm font-semibold text-slate-600 mb-3 text-center">
				FDI Dental Chart
			</h3>
			<div className="flex flex-col gap-2">
				{renderRow(upperTeeth)}
				<div className="h-px bg-slate-200 my-1" />
				{renderRow(lowerTeeth)}
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-3 mt-4 justify-center">
				{Object.entries(STATUS_COLORS).map(([status, cls]) => (
					<div key={status} className="flex items-center gap-1.5 text-xs">
						<div className={`w-4 h-4 rounded border ${cls}`} />
						<span className="capitalize text-slate-600">{status}</span>
					</div>
				))}
			</div>
		</div>
	);
}
