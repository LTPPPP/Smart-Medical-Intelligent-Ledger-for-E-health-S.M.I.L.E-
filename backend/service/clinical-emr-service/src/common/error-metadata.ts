export interface SanitizedErrorMetadata {
  errorClass: string;
  errorCode: string;
}

function boundedErrorField(value: unknown, fallback: string): string {
  return typeof value === 'string' &&
    /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(value)
    ? value
    : fallback;
}

export function getSanitizedErrorMetadata(
  error: unknown,
): SanitizedErrorMetadata {
  const candidate =
    error && typeof error === 'object'
      ? (error as { name?: unknown; code?: unknown })
      : undefined;

  return {
    errorClass: boundedErrorField(candidate?.name, 'UnknownError'),
    errorCode: boundedErrorField(candidate?.code, 'unknown'),
  };
}
