interface DentalChartFormContext {
	isFinalized: boolean;
	patientId?: string | null;
	recordId?: string | null;
	toothNumber: string;
}

export const DENTAL_CHART_TOOTH_NUMBER_MESSAGE =
	"Enter a valid FDI tooth number: 11-18, 21-28, 31-38, or 41-48.";

export function normalizeDentalChartToothNumber(value: string): number | null {
	const toothNumber = Number(value);
	if (!Number.isInteger(toothNumber)) {
		return null;
	}
	const quadrant = Math.floor(toothNumber / 10);
	const tooth = toothNumber % 10;
	return quadrant >= 1 && quadrant <= 4 && tooth >= 1 && tooth <= 8
		? toothNumber
		: null;
}

export function getDentalChartFormBlocker({
	isFinalized,
	patientId,
	recordId,
	toothNumber,
}: DentalChartFormContext): string | null {
	if (isFinalized) {
		return "Finalized encounters are locked.";
	}
	if (!patientId?.trim()) {
		return "Session has no patient.";
	}
	if (!recordId?.trim()) {
		return "Session has no linked medical record.";
	}
	if (!normalizeDentalChartToothNumber(toothNumber)) {
		return DENTAL_CHART_TOOTH_NUMBER_MESSAGE;
	}
	return null;
}
