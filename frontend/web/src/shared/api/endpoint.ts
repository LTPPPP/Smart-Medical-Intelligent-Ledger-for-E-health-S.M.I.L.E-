import { ENV } from "@/shared/constants/env";

// Gateway Base Url
const GATEWAY = ENV.SERVICES.GATEWAY;

const ACCOUNT_BASE = GATEWAY;
const CLINIC_BASE = GATEWAY;
const APPOINTMENT_BASE = `${GATEWAY}/appointments`;
const PATIENT_BASE = GATEWAY;
const SCHEDULE_BASE = GATEWAY;
const SERVICE_BASE = GATEWAY;
const EXAMINATION_BASE = GATEWAY;
const DENTAL_IMAGE_BASE = GATEWAY;
const PAYMENT_BASE = `${GATEWAY}/payments`;
const AI_BASE = GATEWAY;

export const API_ENDPOINTS = {
	// ACCOUNT SERVICE
	AUTH: {
		LOGIN: `${ACCOUNT_BASE}/auth/email/login`,
		REGISTER: `${ACCOUNT_BASE}/auth/email/register`,
		LOGOUT: `${ACCOUNT_BASE}/auth/logout`,
		REFRESH: `${ACCOUNT_BASE}/auth/refresh`,
		FORGOT_PASSWORD: `${ACCOUNT_BASE}/auth/forgot/password`,
		RESET_PASSWORD: `${ACCOUNT_BASE}/auth/reset/password`,
		CHANGE_PASSWORD: `${ACCOUNT_BASE}/auth/change-password`,
		GOOGLE: `${ACCOUNT_BASE}/auth/google`,

		// OTP
		SEND_OTP: `${ACCOUNT_BASE}/auth/otp/send`,
		VERIFY_OTP: `${ACCOUNT_BASE}/auth/otp/verify`,
		VERIFY_EMAIL: `${ACCOUNT_BASE}/auth/email/confirm`,
		SEND_PHONE_OTP: `${ACCOUNT_BASE}/accounts/me/phone/send-otp`,
		VERIFY_PHONE: `${ACCOUNT_BASE}/accounts/me/verify-phone`,
	},

	USER: {
		ME: `${ACCOUNT_BASE}/accounts/me`,
		UPDATE_PROFILE: `${ACCOUNT_BASE}/accounts/me`,
		AVATAR_SIGNATURE: `${ACCOUNT_BASE}/accounts/me/avatar/signature`,
		CONFIRM_AVATAR: `${ACCOUNT_BASE}/accounts/me/avatar/confirm`,
	},

	KYC: {
		ME: `${ACCOUNT_BASE}/kyc/me`,
		HISTORY: `${ACCOUNT_BASE}/kyc/me/history`,
		SUBMIT: `${ACCOUNT_BASE}/kyc/me/submit`,
	},

	ROLE: {
		LIST: `${ACCOUNT_BASE}/roles`,
	},

	OAUTH: {
		GOOGLE: `${ACCOUNT_BASE}/auth/google`,
	},

	// ADMIN
	ADMIN: {
		USERS: {
			LIST: `${ACCOUNT_BASE}/users`,
			// Lock Unlock Account
			LOCK: (userId: string) => `${ACCOUNT_BASE}/accounts/${userId}/lock`,
			UNLOCK: (userId: string) => `${ACCOUNT_BASE}/accounts/${userId}/unlock`,
			UPDATE_ROLES: (userId: string) => `${ACCOUNT_BASE}/users/${userId}/roles`,
		},
		// Account Lifecycle Actions
		ACCOUNTS: {
			DEACTIVATE: (id: string) => `${ACCOUNT_BASE}/accounts/${id}/deactivate`,
			REACTIVATE: (id: string) => `${ACCOUNT_BASE}/accounts/${id}/reactivate`,
			RESET_PASSWORD: (id: string) =>
				`${ACCOUNT_BASE}/accounts/${id}/reset-password`,
			FORCE_LOGOUT: (id: string) =>
				`${ACCOUNT_BASE}/accounts/${id}/force-logout`,
		},
		USER_PROFILES: {
			LIST: `${ACCOUNT_BASE}/user-profiles`,
			// Unguarded Profile Lookup
			DETAIL: (id: string) => `${ACCOUNT_BASE}/user-profiles/${id}`,
			BAN: (id: string) => `${ACCOUNT_BASE}/user-profiles/${id}/ban`,
			UNBAN: (id: string) => `${ACCOUNT_BASE}/user-profiles/${id}/unban`,
		},
		USER_ROLES: {
			BY_USER: (userId: string) => `${ACCOUNT_BASE}/user-roles/user/${userId}`,
			ASSIGN: (userId: string) => `${ACCOUNT_BASE}/user-roles/user/${userId}`,
			REVOKE: (userId: string, roleId: string) =>
				`${ACCOUNT_BASE}/user-roles/user/${userId}/role/${roleId}`,
		},
		ROLES: {
			LIST: `${ACCOUNT_BASE}/roles`,
			DETAIL: (roleId: string) => `${ACCOUNT_BASE}/roles/${roleId}`,
			BY_NAME: (roleName: string) => `${ACCOUNT_BASE}/roles/name/${roleName}`,
			CREATE: `${ACCOUNT_BASE}/roles`,
			UPDATE: (roleId: string) => `${ACCOUNT_BASE}/roles/${roleId}`,
			DELETE: (roleId: string) => `${ACCOUNT_BASE}/roles/${roleId}`,
			PERMISSIONS: (roleId: string) =>
				`${ACCOUNT_BASE}/roles/${roleId}/permissions`,
			UPDATE_PERMISSIONS: (roleId: string) =>
				`${ACCOUNT_BASE}/roles/${roleId}/permissions`,
			ADD_PERMISSION: (roleId: string, permissionId: string) =>
				`${ACCOUNT_BASE}/roles/${roleId}/permissions/${permissionId}`,
			REMOVE_PERMISSION: (roleId: string, permissionId: string) =>
				`${ACCOUNT_BASE}/roles/${roleId}/permissions/${permissionId}`,
		},
		PERMISSIONS: {
			LIST: `${ACCOUNT_BASE}/roles/permissions`,
			DETAIL: (permissionId: string) =>
				`${ACCOUNT_BASE}/roles/permissions/${permissionId}`,
		},
		// Direct permission management via /v1/permissions
		PERMISSIONS_V1: {
			LIST: `${ACCOUNT_BASE}/permissions`,
			CREATE: `${ACCOUNT_BASE}/permissions`,
			DETAIL: (id: string) => `${ACCOUNT_BASE}/permissions/${id}`,
			UPDATE: (id: string) => `${ACCOUNT_BASE}/permissions/${id}`,
			DELETE: (id: string) => `${ACCOUNT_BASE}/permissions/${id}`,
			BY_ROLE: (roleId: string) => `${ACCOUNT_BASE}/permissions/role/${roleId}`,
			ASSIGN_TO_ROLE: (roleId: string) =>
				`${ACCOUNT_BASE}/permissions/role/${roleId}`,
			REVOKE_FROM_ROLE: (roleId: string, permissionId: string) =>
				`${ACCOUNT_BASE}/permissions/role/${roleId}/${permissionId}`,
		},
		AUDIT_LOGS: {
			LIST: `${ACCOUNT_BASE}/audit-logs`,
		},
		KYC: {
			LIST: `${ACCOUNT_BASE}/kyc`,
			DETAIL: (id: string) => `${ACCOUNT_BASE}/kyc/${id}`,
			FILE: (id: string, kind: string) =>
				`${ACCOUNT_BASE}/kyc/${id}/files/${kind}`,
			APPROVE: (id: string) => `${ACCOUNT_BASE}/kyc/${id}/approve`,
			REJECT: (id: string) => `${ACCOUNT_BASE}/kyc/${id}/reject`,
		},
	},

	// CLINIC SERVICE
	CLINIC: {
		LIST: `${CLINIC_BASE}/clinics`,
		DETAIL: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
		BY_CODE: (code: string) => `${CLINIC_BASE}/clinics/code/${code}`,
		CREATE: `${CLINIC_BASE}/clinics`,
		UPDATE: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
		DELETE: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
		LOGO_SIGNATURE: `${CLINIC_BASE}/clinics/logo-signature`,
		SEARCH: `${CLINIC_BASE}/clinics/search`,
		STATS_BY_STATUS: (status: string) =>
			`${CLINIC_BASE}/clinics/stats/status/${status}`,
	},

	TREATMENT_ROOM: {
		BY_CLINIC: (clinicId: string) =>
			`${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms`,
		DETAIL: (clinicId: string, roomId: string) =>
			`${CLINIC_BASE}/treatment-rooms/${roomId}`,
		BY_CODE: (clinicId: string, code: string) =>
			`${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms/code/${code}`,
		CREATE: (clinicId: string) =>
			`${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms`,
		UPDATE: (clinicId: string, roomId: string) =>
			`${CLINIC_BASE}/treatment-rooms/${roomId}`,
		DELETE: (clinicId: string, roomId: string) =>
			`${CLINIC_BASE}/treatment-rooms/${roomId}`,
		SEARCH: (clinicId: string) =>
			`${CLINIC_BASE}/clinics/${clinicId}/treatment-rooms/search`,
		AVAILABILITY: (id: string) =>
			`${CLINIC_BASE}/treatment-rooms/${id}/availability`,
	},

	// APPOINTMENT SERVICE
	APPOINTMENT: {
		LIST: `${APPOINTMENT_BASE}`,
		AVAILABILITY: `${APPOINTMENT_BASE}/availability`,
		BOOK_OPTION: `${APPOINTMENT_BASE}/book-option`,
		// Auto Assign Doctor
		CREATE_BY_CLINIC: `${APPOINTMENT_BASE}/by-clinic`,
		CREATE_BY_SPECIALTY: `${APPOINTMENT_BASE}/by-specialty`,
		CREATE_BY_DOCTOR: `${APPOINTMENT_BASE}/by-doctor`,
		CREATE_OUTSIDE_HOURS: `${APPOINTMENT_BASE}/outside-hours`,
		CHECK_IN_ASSIGN: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/check-in-assign`,

		BY_DOCTOR: (doctorId: string) => `${APPOINTMENT_BASE}/doctor/${doctorId}`,
		DOCTOR_WORKLIST: (doctorId: string) =>
			`${APPOINTMENT_BASE}/doctor/${doctorId}/worklist`,
		BY_PATIENT: (patientId: string) =>
			`${APPOINTMENT_BASE}/patient/${patientId}`,

		DETAIL: (id: string) => `${APPOINTMENT_BASE}/${id}`,
		BY_CODE: (code: string) => `${APPOINTMENT_BASE}/code/${code}`,
		HISTORY: (id: string) => `${APPOINTMENT_BASE}/${id}/history`,
		UPDATE: (id: string) => `${APPOINTMENT_BASE}/${id}`,
		STATUS: (id: string) => `${APPOINTMENT_BASE}/${id}/status`,
		CANCEL: (id: string) => `${APPOINTMENT_BASE}/${id}/cancel`,
		CONFIRM: (id: string) => `${APPOINTMENT_BASE}/${id}/confirm`,
		CHECK_IN: (id: string) => `${APPOINTMENT_BASE}/${id}/check-in`,
		SEND_CONFIRMATION: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/confirmation`,
		SEND_REMINDER: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/reminder`,
		RETRY_REMINDER: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/reminder/retry`,
		REMINDER_PREFERENCE: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/reminder-preference`,
		REMINDER_READ: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/reminder/read`,
		REMINDER_RESPONDED: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/reminder/responded`,
		NOTIFICATION_LOGS: (id: string) =>
			`${APPOINTMENT_BASE}/${id}/notifications/logs`,
	},

	VNPAY: {
		CREATE_PAYMENT: `${PAYMENT_BASE}/initiate`,
		RETURN: `${PAYMENT_BASE}/vnpay-return`,
	},

	// PAYMENT SERVICE
	PAYMENT: {
		INITIATE: `${PAYMENT_BASE}/initiate`,
		VNPAY_RETURN: `${PAYMENT_BASE}/vnpay-return`,
		DETAIL: (id: string) => `${PAYMENT_BASE}/${id}`,
		BY_APPOINTMENT: (appointmentId: string) =>
			`${PAYMENT_BASE}/appointment/${appointmentId}`,
		LIST: `${PAYMENT_BASE}`,
		REFUND: (id: string) => `${PAYMENT_BASE}/${id}/refund`,
		REFUND_QUEUE: `${PAYMENT_BASE}/refunds`,
		REFUND_APPROVE: (id: string) => `${PAYMENT_BASE}/${id}/refund/approve`,
		REFUND_REJECT: (id: string) => `${PAYMENT_BASE}/${id}/refund/reject`,
	},

	// IAM NOTIFICATIONS (web push)
	NOTIFICATION: {
		PUSH_SUBSCRIPTIONS: `${GATEWAY}/notifications/push-subscriptions`,
		VAPID_PUBLIC_KEY: `${GATEWAY}/notifications/vapid-public-key`,
	},

	AI: {
		BOOKING_CHAT: `${AI_BASE}/ai/booking-chat/chat`,
	},

	// PATIENT MEDIA RECORD SERVICE
	PATIENT: {
		LIST: `${PATIENT_BASE}/patients`,
		DETAIL: (id: string) => `${PATIENT_BASE}/patients/${id}`,
		CREATE: `${PATIENT_BASE}/patients`,
		UPDATE: (id: string) => `${PATIENT_BASE}/patients/${id}`,
		DELETE: (id: string) => `${PATIENT_BASE}/patients/${id}`,
		ME: `${PATIENT_BASE}/patients/me`,
		// Self Service Provisioning
		CREATE_MINE: `${PATIENT_BASE}/patients/me`,
		UNBLOCK_BOOKING: (id: string) =>
			`${PATIENT_BASE}/patients/${id}/unblock-booking`,
	},

	PATIENT_REPRESENTATIVE: {
		CREATE: `${PATIENT_BASE}/patient-representatives`,
		BY_PATIENT: (patientId: string) =>
			`${PATIENT_BASE}/patient-representatives/patient/${patientId}`,
		DETAIL: (id: string) => `${PATIENT_BASE}/patient-representatives/${id}`,
		UPDATE: (id: string) => `${PATIENT_BASE}/patient-representatives/${id}`,
		VERIFY: (id: string) =>
			`${PATIENT_BASE}/patient-representatives/${id}/verify`,
	},

	MEDICAL_RECORD: {
		BY_PATIENT: (patientId: string) =>
			`${PATIENT_BASE}/medical-records/patient/${patientId}`,
		LIST_BY_PATIENT: (patientId: string) =>
			`${PATIENT_BASE}/medical-records/patient/${patientId}/search`,
		DETAIL: (id: string) => `${PATIENT_BASE}/medical-records/${id}`,
		CREATE: `${PATIENT_BASE}/medical-records`,
		UPDATE: (id: string) => `${PATIENT_BASE}/medical-records/${id}`,
		DELETE: (id: string) => `${PATIENT_BASE}/medical-records/${id}`,
		FINALIZE: (id: string) => `${PATIENT_BASE}/medical-records/${id}/finalize`,
		ME_LIST: `${PATIENT_BASE}/medical-records/me`,
		ME_DETAIL: (id: string) => `${PATIENT_BASE}/medical-records/me/${id}`,
	},

	TREATMENT_HISTORY: {
		CREATE: `${PATIENT_BASE}/treatment-history`,
		BY_PATIENT: (patientId: string) =>
			`${PATIENT_BASE}/treatment-history/patient/${patientId}`,
		UPDATE: (treatmentId: string) =>
			`${PATIENT_BASE}/treatment-history/${treatmentId}`,
		DELETE: (treatmentId: string) =>
			`${PATIENT_BASE}/treatment-history/${treatmentId}`,
	},

	MEDICAL_HISTORY: {
		BY_PATIENT: (patientId: string) =>
			`${PATIENT_BASE}/patients/${patientId}/history`,
		CREATE: (patientId: string) =>
			`${PATIENT_BASE}/patients/${patientId}/history`,
		UPDATE: (patientId: string, historyId: string) =>
			`${PATIENT_BASE}/patients/${patientId}/history/${historyId}`,
		DELETE: (patientId: string, historyId: string) =>
			`${PATIENT_BASE}/patients/${patientId}/history/${historyId}`,
	},

	RECORD_EXPORT: {
		CREATE: `${PATIENT_BASE}/record-exports`,
		BY_RECORD: (recordId: string) =>
			`${PATIENT_BASE}/record-exports/record/${recordId}`,
	},

	// SCHEDULE SERVICE
	SCHEDULE: {
		LIST: `${SCHEDULE_BASE}/doctor-schedules`,
		DETAIL: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}`,
		BY_DOCTOR: (doctorId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/doctor/${doctorId}`,
		BY_CLINIC: (clinicId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/clinic/${clinicId}`,
		CREATE: `${SCHEDULE_BASE}/doctor-schedules`,
		UPDATE: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}`,
		CANCEL: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}/cancel`,
		COMPLETE: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}/complete`,
		DELETE: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}`,
		STATISTICS: `${SCHEDULE_BASE}/doctor-schedules/statistics`,
		TRANSFER: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}/transfer`,
		CHANGES: (scheduleId: string) =>
			`${SCHEDULE_BASE}/doctor-schedules/${scheduleId}/changes`,
	},

	WORK_SHIFT: {
		LIST: `${SCHEDULE_BASE}/work-shifts`,
		DETAIL: (shiftId: string) => `${SCHEDULE_BASE}/work-shifts/${shiftId}`,
		CREATE: `${SCHEDULE_BASE}/work-shifts`,
		UPDATE: (shiftId: string) => `${SCHEDULE_BASE}/work-shifts/${shiftId}`,
		DELETE: (shiftId: string) => `${SCHEDULE_BASE}/work-shifts/${shiftId}`,
	},

	DOCTOR_LEAVE: {
		LIST: `${SCHEDULE_BASE}/doctor-leaves`,
		DETAIL: (leaveId: string) => `${SCHEDULE_BASE}/doctor-leaves/${leaveId}`,
		BY_DOCTOR: (doctorId: string) =>
			`${SCHEDULE_BASE}/doctor-leaves/doctor/${doctorId}`,
		CREATE: `${SCHEDULE_BASE}/doctor-leaves`,
		DELETE: (leaveId: string) => `${SCHEDULE_BASE}/doctor-leaves/${leaveId}`,
		STATISTICS: `${SCHEDULE_BASE}/doctor-leaves/statistics`,
	},

	SCHEDULE_CHANGE: {
		LIST: `${SCHEDULE_BASE}/schedule-changes`,
		DETAIL: (changeId: string) =>
			`${SCHEDULE_BASE}/schedule-changes/${changeId}`,
		CREATE: `${SCHEDULE_BASE}/schedule-changes`,
		APPROVE: (changeId: string) =>
			`${SCHEDULE_BASE}/schedule-changes/${changeId}/approve`,
		REJECT: (changeId: string) =>
			`${SCHEDULE_BASE}/schedule-changes/${changeId}/reject`,
	},

	SCHEDULE_NOTIFICATION: {
		BY_RECIPIENT: (recipientId: string) =>
			`${SCHEDULE_BASE}/notifications/recipient/${recipientId}`,
		SEND: `${SCHEDULE_BASE}/notifications`,
		MARK_READ: (notificationId: string) =>
			`${SCHEDULE_BASE}/notifications/${notificationId}/read`,
		SEND_REMINDER: (scheduleId: string) =>
			`${SCHEDULE_BASE}/notifications/reminder/${scheduleId}`,
	},

	// SERVICE SERVICE
	SERVICE: {
		LIST: `${SERVICE_BASE}/services`,
		DETAIL: (id: string) => `${SERVICE_BASE}/services/${id}`,
		BY_SPECIALTY: (specialtyId: string) =>
			`${SERVICE_BASE}/services/specialty/${specialtyId}`,
		SEARCH: `${SERVICE_BASE}/services/search`,
		CREATE: `${SERVICE_BASE}/services`,
		UPDATE: (id: string) => `${SERVICE_BASE}/services/${id}`,
		DELETE: (id: string) => `${SERVICE_BASE}/services/${id}`,
	},

	SPECIALTY: {
		LIST: `${SERVICE_BASE}/specialties`,
		DETAIL: (id: string) => `${SERVICE_BASE}/specialties/${id}`,
		CREATE: `${SERVICE_BASE}/specialties`,
		UPDATE: (id: string) => `${SERVICE_BASE}/specialties/${id}`,
		DELETE: (id: string) => `${SERVICE_BASE}/specialties/${id}`,
	},

	DOCTOR_SPECIALTY: {
		BY_DOCTOR: (doctorId: string) =>
			`${SERVICE_BASE}/doctor-specialties/doctor/${doctorId}`,
		BY_SPECIALTY: (specialtyId: string) =>
			`${SERVICE_BASE}/doctor-specialties/specialty/${specialtyId}`,
	},

	SERVICE_CATEGORY: {
		LIST: `${SERVICE_BASE}/service-categories`,
		DETAIL: (id: string) => `${SERVICE_BASE}/service-categories/${id}`,
		CREATE: `${SERVICE_BASE}/service-categories`,
		UPDATE: (id: string) => `${SERVICE_BASE}/service-categories/${id}`,
		DELETE: (id: string) => `${SERVICE_BASE}/service-categories/${id}`,
	},

	// EXAMINATION SERVICE
	EXAMINATION: {
		BY_APPOINTMENT: (appointmentId: string) =>
			`${EXAMINATION_BASE}/examination-sessions/appointment/${appointmentId}`,
		BY_PATIENT: (patientId: string) =>
			`${EXAMINATION_BASE}/examination-sessions/patient/${patientId}`,
		CREATE: `${EXAMINATION_BASE}/examination-sessions`,
		UPDATE: (id: string) => `${EXAMINATION_BASE}/examination-sessions/${id}`,
	},

	// REPORTS (clinical-emr reports module)
	REPORTS: {
		DOCTOR_PERFORMANCE: `${GATEWAY}/reports/doctor-performance`,
		DASHBOARD_DOCTOR: `${GATEWAY}/reports/dashboard/doctor`,
		DASHBOARD_PATIENT: `${GATEWAY}/reports/dashboard/patient`,
		REVENUE: `${GATEWAY}/reports/revenue`,
	},

	DIAGNOSIS: {
		BY_SESSION: (sessionId: string) =>
			`${EXAMINATION_BASE}/diagnoses/session/${sessionId}`,
		CREATE: `${EXAMINATION_BASE}/diagnoses`,
		UPDATE: (id: string) => `${EXAMINATION_BASE}/diagnoses/${id}`,
	},

	PRESCRIPTION: {
		BY_SESSION: (sessionId: string) =>
			`${EXAMINATION_BASE}/prescriptions/session/${sessionId}`,
		CREATE: `${EXAMINATION_BASE}/prescriptions`,
		ME: `${EXAMINATION_BASE}/prescriptions/me`,
	},

	TREATMENT_PLAN: {
		BY_SESSION: (sessionId: string) =>
			`${EXAMINATION_BASE}/treatment-plans/session/${sessionId}`,
		BY_PATIENT: (patientId: string) =>
			`${EXAMINATION_BASE}/treatment-plans/patient/${patientId}`,
		CREATE: `${EXAMINATION_BASE}/treatment-plans`,
	},

	// DENTAL IMAGE SERVICE
	DENTAL_IMAGE: {
		UPLOAD: `${DENTAL_IMAGE_BASE}/dental-images`,
		UPLOAD_BATCH: `${DENTAL_IMAGE_BASE}/dental-images`,
		BY_PATIENT: (patientId: string) =>
			`${DENTAL_IMAGE_BASE}/dental-images/patient/${patientId}`,
		DETAIL: (id: string) => `${DENTAL_IMAGE_BASE}/dental-images/${id}`,
		DOWNLOAD: (id: string) =>
			`${DENTAL_IMAGE_BASE}/dental-images/${id}/download`,
		BY_CATEGORY: (categoryId: string) =>
			`${DENTAL_IMAGE_BASE}/dental-images/category/${categoryId}`,
		UPDATE: (id: string) => `${DENTAL_IMAGE_BASE}/dental-images/${id}`,
		DELETE: (id: string) => `${DENTAL_IMAGE_BASE}/dental-images/${id}`,

		ANALYZE: (id: string) => `${DENTAL_IMAGE_BASE}/dental-images/${id}/analyze`,
		ANALYSIS_RESULT: (id: string) =>
			`${DENTAL_IMAGE_BASE}/dental-images/${id}/analysis`,
	},

	IMAGE_CATEGORY: {
		LIST: `${DENTAL_IMAGE_BASE}/image-categories`,
		CREATE: `${DENTAL_IMAGE_BASE}/image-categories`,
	},
} as const;
