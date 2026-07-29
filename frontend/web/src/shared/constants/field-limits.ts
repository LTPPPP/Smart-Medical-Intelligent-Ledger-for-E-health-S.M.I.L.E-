/**
 * Maximum lengths mirrored from the database column widths.
 *
 * These are the real `varchar(n)` sizes after the TightenColumnWidths migrations,
 * so a value that passes validation here cannot be rejected by the database with
 * a 22001 string_data_right_truncation. Keep this file in step with
 * `database/DATA-FIELD-SIZES.md`; if a column is widened, widen it here too.
 *
 * Columns typed `TEXT` in the database have no hard limit — the caps below for
 * those (notes, address, reasons) are deliberate UI choices, marked accordingly.
 */
export const FIELD_LIMITS = {
	// ── identity / contact (shared across accounts, users, patients) ──
	fullName: 255,
	email: 255,
	phone: 20,
	username: 50,

	// ── address parts ──
	ward: 100,
	district: 100,
	city: 100,

	// ── patient ──
	patientCode: 50,
	emergencyContact: 255,
	insuranceNumber: 100,
	insuranceProvider: 255,

	// ── representative ──
	relationship: 100,
	legalDocumentNumber: 100,

	// ── clinic / room / service ──
	clinicName: 255,
	clinicCode: 50,
	licenseNumber: 100,
	website: 255,
	roomName: 100,
	roomCode: 50,
	serviceName: 255,
	serviceCode: 50,
	specialtyName: 255,
	specialtyCode: 50,

	// ── clinical ──
	appointmentCode: 50,
	icdCode: 20,
	diagnosisName: 255,
	symptomName: 255,
	bodyLocation: 100,
	duration: 100,
	testName: 255,
	resultUnit: 50,
	referenceRange: 100,
	procedureCode: 50,
	procedureName: 255,
	planName: 255,
	quoteVersion: 100,

	// ── prescription ──
	medicationName: 255,
	medicationCode: 50,
	dosage: 100,
	frequency: 100,

	/**
	 * bcrypt only hashes the first 72 bytes of a password, so anything longer is
	 * silently truncated before it is ever stored. Capping here makes that limit
	 * explicit instead of surprising.
	 */
	password: 72,

	// ── TEXT columns: no DB limit, these are UI choices ──
	notes: 1000,
	address: 500,
	reason: 500,
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;
