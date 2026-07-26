export interface AuditActionMeta {
	label: string;
	className: string;
}

/**
 * Maps raw `action` strings written by iam-service's AuditLogsService.create() calls
 * (see auth.controller.ts and kyc-verifications/* services) to a readable label + badge color.
 * Unknown/future actions fall back to `getAuditActionMeta`'s default below.
 */
export const AUDIT_ACTION_LABELS: Record<string, AuditActionMeta> = {
	LOGIN: {
		label: "Logged in",
		className:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	LOGOUT: {
		label: "Logged out",
		className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
	},
	REGISTER: {
		label: "Registered",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	KYC_SUBMITTED: {
		label: "Submitted KYC",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
	KYC_APPROVED: {
		label: "Approved KYC",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	KYC_REJECTED: {
		label: "Rejected KYC",
		className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
	},
	KYC_AUTO_VERIFIED: {
		label: "Auto-verified KYC",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	KYC_FILES_DELETED: {
		label: "Deleted KYC files",
		className:
			"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	},
	KYC_FILE_VIEWED: {
		label: "Viewed KYC file",
		className:
			"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
	},
};

const DEFAULT_ACTION_META: AuditActionMeta = {
	label: "",
	className:
		"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function getAuditActionMeta(action: string): AuditActionMeta {
	return (
		AUDIT_ACTION_LABELS[action] ?? { ...DEFAULT_ACTION_META, label: action }
	);
}

export const AUDIT_ACTION_OPTIONS = Object.keys(AUDIT_ACTION_LABELS).map(
	(value) => ({
		value,
		label: AUDIT_ACTION_LABELS[value].label,
	}),
);

/** Solid dot colors for the mobile timeline view (badge backgrounds above are too light to read as a dot). */
const AUDIT_ACTION_DOT_COLORS: Record<string, string> = {
	LOGIN: "bg-green-500",
	LOGOUT: "bg-gray-400",
	REGISTER: "bg-blue-500",
	KYC_SUBMITTED: "bg-amber-500",
	KYC_APPROVED: "bg-emerald-500",
	KYC_REJECTED: "bg-red-500",
	KYC_AUTO_VERIFIED: "bg-emerald-500",
	KYC_FILES_DELETED: "bg-slate-400",
	KYC_FILE_VIEWED: "bg-indigo-500",
};

export function getAuditActionDotColor(action: string): string {
	return AUDIT_ACTION_DOT_COLORS[action] ?? "bg-slate-400";
}

/** Maps raw `resource` strings to a readable label. */
export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
	auth: "Authentication",
	kyc: "KYC Verification",
	kyc_file: "KYC File",
	kyc_verification: "KYC Verification",
};

export function getAuditResourceLabel(resource: string): string {
	return AUDIT_RESOURCE_LABELS[resource] ?? resource;
}

export const AUDIT_RESOURCE_OPTIONS = Object.keys(AUDIT_RESOURCE_LABELS).map(
	(value) => ({
		value,
		label: AUDIT_RESOURCE_LABELS[value],
	}),
);
