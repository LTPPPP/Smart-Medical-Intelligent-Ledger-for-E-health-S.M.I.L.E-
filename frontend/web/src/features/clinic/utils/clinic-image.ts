const CLINIC_IMAGE_BY_CODE: Record<string, string> = {
	"SMILE-HCM": "/images/clinics/smile-hcm.svg",
	"SMILE-HN": "/images/clinics/smile-hn.svg",
	"SMILE-DN": "/images/clinics/smile-dn.svg",
	"SMILE-CT": "/images/clinics/smile-ct.svg",
};

export const DEFAULT_CLINIC_IMAGE = "/images/clinics/default.svg";

function isSupportedImageUrl(value: string): boolean {
	return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export function getClinicImageUrl(
	logoUrl: string | null | undefined,
	clinicCode: string,
): string {
	const normalizedLogoUrl = logoUrl?.trim();
	if (normalizedLogoUrl && isSupportedImageUrl(normalizedLogoUrl)) {
		return normalizedLogoUrl;
	}

	return CLINIC_IMAGE_BY_CODE[clinicCode.toUpperCase()] ?? DEFAULT_CLINIC_IMAGE;
}
