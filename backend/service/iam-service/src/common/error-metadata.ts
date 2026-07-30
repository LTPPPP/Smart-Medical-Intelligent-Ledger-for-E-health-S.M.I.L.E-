export interface SanitizedErrorMetadata {
  errorClass: string;
  errorCode: string;
}

function boundedErrorField(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(value) ? value : fallback;
}

export function getSanitizedErrorMetadata(error: unknown): SanitizedErrorMetadata {
  const candidate = error && typeof error === 'object' ? (error as { name?: unknown; code?: unknown }) : undefined;

  return {
    errorClass: boundedErrorField(candidate?.name, 'UnknownError'),
    errorCode: boundedErrorField(candidate?.code, 'unknown'),
  };
}

export function serializeSanitizedErrorMetadata(error: unknown): string {
  const { errorClass, errorCode } = getSanitizedErrorMetadata(error);
  return `error_class=${errorClass} error_code=${errorCode}`;
}

export function normalizeStoredErrorMetadata(value: unknown, fallbackClass = 'UnknownError'): string {
  if (
    typeof value === 'string' &&
    /^error_class=[A-Za-z][A-Za-z0-9_.-]{0,63} error_code=[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(value)
  ) {
    return value;
  }

  return `error_class=${boundedErrorField(fallbackClass, 'UnknownError')} error_code=unknown`;
}
