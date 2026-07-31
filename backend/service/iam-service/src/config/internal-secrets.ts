/**
 * Service-to-service credentials. Unlike user auth these have no fallback:
 * an unset value means the guard denies every request, which would silently
 * break internal traffic in production, so startup fails loudly instead.
 *
 * Local development and tests are exempt so a bare `docker compose up` still
 * boots, but the guards themselves stay fail-closed everywhere.
 */
const REQUIRED_INTERNAL_SECRETS = [
  'INTERNAL_SERVICE_TOKEN',
  'IAM_INTERNAL_API_KEY',
] as const;

const EXEMPT_ENVIRONMENTS = new Set(['development', 'test']);

export function assertInternalSecretsConfigured(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (EXEMPT_ENVIRONMENTS.has(env.NODE_ENV ?? 'development')) {
    return;
  }

  const missing = REQUIRED_INTERNAL_SECRETS.filter(
    (name) => !env[name] || env[name]?.trim() === '',
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required internal service secrets: ${missing.join(', ')}. ` +
        'Set them or run with NODE_ENV=development.',
    );
  }
}
