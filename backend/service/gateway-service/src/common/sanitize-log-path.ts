const UUID_OR_UUID_LIKE =
  /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i;
const SENSITIVE_CODE =
  /^(?:(?:patient|account|user|appointment|payment|record|notification|diagnosis|prescription|refund|pat|usr|apt|pay|rec|notif|diag|rx|mr)[_-].+|[a-z]\d{7}-[a-z0-9-]+)$/i;
const LONG_HEX_OR_TOKEN = /^(?:[a-f0-9]{16,}|[a-z0-9_-]{32,})$/i;
const JWT = /^(?:[a-z0-9_-]{8,}\.){2}[a-z0-9_-]{8,}$/i;

function isDynamicIdentifier(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    UUID_OR_UUID_LIKE.test(segment) ||
    SENSITIVE_CODE.test(segment) ||
    LONG_HEX_OR_TOKEN.test(segment) ||
    JWT.test(segment) ||
    /^[^/]+(?:@|%40)[^/]+$/i.test(segment)
  );
}

export function sanitizeLogPath(url: string | undefined): string {
  if (!url) return '/';

  let pathname: string;
  try {
    pathname = new URL(url, 'http://gateway.local').pathname;
  } catch {
    pathname = url.split(/[?#]/, 1)[0] || '/';
  }

  const withoutControls = pathname
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/%(?:0[0-9a-f]|1[0-9a-f]|7f)/gi, '');

  const sanitized = withoutControls
    .split('/')
    .map((segment) => (isDynamicIdentifier(segment) ? ':id' : segment))
    .join('/');

  return sanitized || '/';
}
