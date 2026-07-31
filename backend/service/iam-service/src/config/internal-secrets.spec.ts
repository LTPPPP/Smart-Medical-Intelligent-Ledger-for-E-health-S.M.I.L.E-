import { assertInternalSecretsConfigured } from './internal-secrets';

describe('assertInternalSecretsConfigured', () => {
  it('fails startup in production when a secret is missing', () => {
    expect(() =>
      assertInternalSecretsConfigured({
        NODE_ENV: 'production',
        IAM_INTERNAL_API_KEY: 'set',
      } as NodeJS.ProcessEnv),
    ).toThrow(/INTERNAL_SERVICE_TOKEN/);
  });

  it('treats a blank value as missing', () => {
    expect(() =>
      assertInternalSecretsConfigured({
        NODE_ENV: 'production',
        INTERNAL_SERVICE_TOKEN: '   ',
        IAM_INTERNAL_API_KEY: 'set',
      } as NodeJS.ProcessEnv),
    ).toThrow(/INTERNAL_SERVICE_TOKEN/);
  });

  it('passes in production when both secrets are set', () => {
    expect(() =>
      assertInternalSecretsConfigured({
        NODE_ENV: 'production',
        INTERNAL_SERVICE_TOKEN: 'token',
        IAM_INTERNAL_API_KEY: 'key',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('does not block local development', () => {
    expect(() =>
      assertInternalSecretsConfigured({
        NODE_ENV: 'development',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});
