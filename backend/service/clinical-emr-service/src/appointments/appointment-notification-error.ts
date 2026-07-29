export interface SanitizedNotificationError {
  errorClass: string;
  errorCode: string;
}

function boundedErrorField(value: unknown, fallback: string): string {
  return typeof value === 'string' &&
    /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(value)
    ? value
    : fallback;
}

export function getSanitizedNotificationError(
  error: unknown,
): SanitizedNotificationError {
  const candidate =
    error && typeof error === 'object'
      ? (error as {
          name?: unknown;
          code?: unknown;
          response?: unknown;
          getResponse?: () => unknown;
        })
      : undefined;
  const response =
    candidate && typeof candidate.getResponse === 'function'
      ? candidate.getResponse()
      : candidate?.response;
  const responseCode =
    response && typeof response === 'object'
      ? (response as { code?: unknown }).code
      : undefined;

  return {
    errorClass: boundedErrorField(candidate?.name, 'UnknownError'),
    errorCode: boundedErrorField(
      candidate?.code ?? responseCode,
      'unknown',
    ),
  };
}

export function formatSanitizedNotificationError(error: unknown): string {
  const { errorClass, errorCode } = getSanitizedNotificationError(error);
  return `error_class=${errorClass} error_code=${errorCode}`;
}
