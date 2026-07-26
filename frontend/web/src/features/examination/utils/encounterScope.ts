interface EncounterScope {
	sessionId?: string | null;
	recordId?: string | null;
}

interface EncounterScopedResource {
	session_id?: string | null;
	record_id?: string | null;
}

interface AppointmentScopedResource {
	appointment_id?: string | null;
}

export function filterByEncounterScope<T extends EncounterScopedResource>(
	items: T[],
	{ sessionId, recordId }: EncounterScope,
): T[] {
	return items.filter((item) => {
		if (item.session_id) {
			return item.session_id === sessionId;
		}

		if (item.record_id) {
			return item.record_id === recordId;
		}

		return false;
	});
}

export function filterByAppointmentScope<T extends AppointmentScopedResource>(
	items: T[],
	appointmentId?: string | null,
): T[] {
	return items.filter(
		(item) =>
			Boolean(item.appointment_id) && item.appointment_id === appointmentId,
	);
}
