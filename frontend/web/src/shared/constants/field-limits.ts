/** Field Limits */
export const FIELD_LIMITS = {
	// Identity / Contact
	fullName: 255,
	email: 255,
	phone: 20,
	username: 50,

	// Address Parts
	ward: 100,
	district: 100,
	city: 100,

	// Patient
	patientCode: 50,
	emergencyContact: 255,
	insuranceNumber: 100,
	insuranceProvider: 255,

	// Representative
	relationship: 100,
	legalDocumentNumber: 100,

	// Clinic / Room / Service
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

	// Clinical
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

	// Prescription
	medicationName: 255,
	medicationCode: 50,
	dosage: 100,
	frequency: 100,

	/** Bcrypt Limit */
	password: 72,

	// Text Columns
	notes: 1000,
	address: 500,
	reason: 500,
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;
