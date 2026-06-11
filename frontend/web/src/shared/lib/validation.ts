const VIETNAMESE_MOBILE_PATTERN = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/dicom',
  'application/dicom',
]);

export function isValidVietnamesePhone(value: string): boolean {
  const normalized = value.replace(/[\s().-]/g, '');
  return VIETNAMESE_MOBILE_PATTERN.test(normalized);
}

export function isFutureDateTime(
  date: string,
  time: string,
  now = new Date(),
): boolean {
  if (!date || !time) return false;

  const candidate = new Date(`${date}T${time}:00`);
  return !Number.isNaN(candidate.getTime()) && candidate.getTime() > now.getTime();
}

export function isValidDateRange(start: string, end: string): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return (
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate.getTime() > startDate.getTime()
  );
}

export function normalizeOptionalText(
  value: string | null | undefined,
  minimumLength = 1,
): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length >= minimumLength ? normalized : undefined;
}

interface UploadCandidate {
  type: string;
  size: number;
}

type UploadValidation =
  | { valid: true }
  | { valid: false; reason: string };

export function isValidImageUpload(
  file: UploadCandidate,
  maximumBytes: number,
): UploadValidation {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return { valid: false, reason: 'Unsupported file type.' };
  }

  if (file.size > maximumBytes) {
    const maximumMegabytes = Math.round(maximumBytes / 1_000_000);
    return {
      valid: false,
      reason: `File size exceeds ${maximumMegabytes} MB.`,
    };
  }

  return { valid: true };
}
