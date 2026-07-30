import { getSanitizedErrorMetadata } from './error-metadata';

describe('getSanitizedErrorMetadata', () => {
  it('should keep bounded error class and code fields', () => {
    expect(
      getSanitizedErrorMetadata({
        name: 'RedisError',
        code: 'ECONNREFUSED',
      }),
    ).toEqual({
      errorClass: 'RedisError',
      errorCode: 'ECONNREFUSED',
    });
  });

  it('should not expose arbitrary error text', () => {
    expect(
      getSanitizedErrorMetadata({
        name: 'unsafe name with patient data',
        code: 'unsafe code@example.com',
        message: 'patient@example.com could not be loaded',
      }),
    ).toEqual({
      errorClass: 'UnknownError',
      errorCode: 'unknown',
    });
  });
});
