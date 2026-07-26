export interface ClinicalAlertPatient {
	date_of_birth?: string | null;
	allergies?: string[] | null;
	chronic_diseases?: string[] | null;
}

export interface ClinicalAlertHistory {
	condition_name?: string | null;
	conditionName?: string | null;
	condition_type?: string | null;
	conditionType?: string | null;
	notes?: string | null;
}

export interface ClinicalAlert {
	tone: "critical" | "warning" | "info" | "neutral";
	label: string;
	value: string;
}

interface BuildClinicalAlertsInput {
	patient?: ClinicalAlertPatient | null;
	medicalHistory?: ClinicalAlertHistory[] | null;
	today?: Date;
}

export function buildClinicalAlerts({
	patient,
	medicalHistory,
	today = new Date(),
}: BuildClinicalAlertsInput): ClinicalAlert[] {
	const alerts: ClinicalAlert[] = [];
	const allergies = nonEmptyValues(patient?.allergies);
	const chronicDiseases = nonEmptyValues(patient?.chronic_diseases);

	if (allergies.length) {
		alerts.push({
			tone: "critical",
			label: "Allergies",
			value: allergies.join(", "),
		});
	}

	const age = calculateAge(patient?.date_of_birth, today);
	if (age !== null && age < 18) {
		alerts.push({
			tone: "warning",
			label: "Minor patient",
			value: `Age ${age}. Confirm guardian/representative before consent-sensitive steps.`,
		});
	}

	if (chronicDiseases.length) {
		alerts.push({
			tone: "info",
			label: "Chronic diseases",
			value: chronicDiseases.join(", "),
		});
	}

	const historySummary = (medicalHistory ?? [])
		.map(formatHistoryItem)
		.filter((value): value is string => Boolean(value));
	if (historySummary.length) {
		alerts.push({
			tone: "info",
			label: "Medical history",
			value: historySummary.join("; "),
		});
	}

	if (!alerts.length) {
		alerts.push({
			tone: "neutral",
			label: "Clinical alerts",
			value: "No allergies, chronic diseases, or medical history recorded.",
		});
	}

	return alerts;
}

function nonEmptyValues(values?: string[] | null): string[] {
	return (values ?? [])
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
}

function calculateAge(
	dateOfBirth?: string | null,
	today = new Date(),
): number | null {
	if (!dateOfBirth) return null;
	const birth = new Date(dateOfBirth);
	if (Number.isNaN(birth.getTime())) return null;

	let age = today.getFullYear() - birth.getFullYear();
	const monthDelta = today.getMonth() - birth.getMonth();
	if (
		monthDelta < 0 ||
		(monthDelta === 0 && today.getDate() < birth.getDate())
	) {
		age -= 1;
	}
	return age;
}

function formatHistoryItem(item: ClinicalAlertHistory): string | null {
	const conditionName = (item.condition_name ?? item.conditionName)?.trim();
	if (!conditionName) return null;

	const conditionType = (item.condition_type ?? item.conditionType)?.trim();
	const notes = item.notes?.trim();
	const suffix = [
		conditionType ? ` (${conditionType})` : "",
		notes ? `: ${notes}` : "",
	].join("");

	return `${conditionName}${suffix}`;
}
