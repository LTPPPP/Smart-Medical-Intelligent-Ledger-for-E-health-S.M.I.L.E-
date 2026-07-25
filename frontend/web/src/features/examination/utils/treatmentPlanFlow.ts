interface TreatmentPlanFormLike {
	plan_name?: string | null;
	duration_weeks?: number | null;
	estimated_cost?: string | number | null;
	quote_currency?: string | null;
	quote_version?: string | null;
	risk_disclosure?: string | null;
	alternative_options?: string | null;
}

interface TreatmentPlanAcceptancePatient {
	date_of_birth?: string | Date | null;
	emergency_contact?: string | null;
	emergency_phone?: string | null;
}

export function validateTreatmentPlanForm({
	plan_name,
	duration_weeks,
	estimated_cost,
	quote_currency,
}: TreatmentPlanFormLike): string | null {
	if (!plan_name?.trim()) {
		return "Plan name is required.";
	}
	if (
		duration_weeks != null &&
		(!Number.isInteger(duration_weeks) || duration_weeks <= 0)
	) {
		return "Duration must be a positive whole number.";
	}
	if (
		estimated_cost !== undefined &&
		estimated_cost !== null &&
		estimated_cost !== ""
	) {
		const amount = Number(estimated_cost);
		if (!Number.isFinite(amount) || amount <= 0) {
			return "Estimated cost must be a positive amount.";
		}
	}
	if (
		quote_currency &&
		!/^[A-Z]{3}$/.test(quote_currency.trim().toUpperCase())
	) {
		return "Currency must use a three-letter code.";
	}
	return null;
}

export function getTreatmentPlanAcceptanceBlocker({
	patient,
	today = new Date(),
}: {
	patient?: TreatmentPlanAcceptancePatient | null;
	today?: Date;
}): string | null {
	if (!isMinorPatient(patient?.date_of_birth, today)) {
		return null;
	}

	if (
		!hasText(patient?.emergency_contact) ||
		!hasText(patient?.emergency_phone)
	) {
		return "Representative contact and phone are required before accepting a treatment plan for a minor patient.";
	}

	return null;
}

function hasText(value?: string | null): boolean {
	return typeof value === "string" && value.trim().length > 0;
}

function isMinorPatient(
	dateOfBirth?: string | Date | null,
	today = new Date(),
): boolean {
	if (!dateOfBirth) {
		return false;
	}

	const birthDate =
		dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
	if (Number.isNaN(birthDate.getTime())) {
		return false;
	}

	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDelta = today.getMonth() - birthDate.getMonth();
	if (
		monthDelta < 0 ||
		(monthDelta === 0 && today.getDate() < birthDate.getDate())
	) {
		age -= 1;
	}

	return age < 18;
}

export function getTreatmentPlanProposalBlocker({
	estimated_cost,
	quote_version,
	risk_disclosure,
	alternative_options,
}: TreatmentPlanFormLike): string | null {
	const amount = Number(estimated_cost);
	if (!Number.isFinite(amount) || amount <= 0) {
		return "Estimated cost is required before proposing.";
	}
	if (!quote_version?.trim()) {
		return "Quote version is required before proposing.";
	}
	if (!risk_disclosure?.trim()) {
		return "Risk disclosure is required before proposing.";
	}
	if (!alternative_options?.trim()) {
		return "Alternative options are required before proposing.";
	}
	return null;
}
