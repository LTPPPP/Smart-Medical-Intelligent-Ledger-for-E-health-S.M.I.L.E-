import { gatewayLoggerLevels, logBootstrapFailure } from './main';

describe('gateway runtime logger configuration', () => {
  it('excludes debug and verbose levels in production', () => {
    expect(gatewayLoggerLevels('production')).toEqual([
      'error',
      'warn',
      'log',
    ]);
    expect(gatewayLoggerLevels('development')).toEqual([
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ]);
  });

  it('does not log raw bootstrap error messages or stacks', () => {
    const logger = { error: jest.fn() };
    const exception = new Error('SENTINEL_BOOTSTRAP_ERROR');
    exception.stack = 'SENTINEL_BOOTSTRAP_STACK';

    logBootstrapFailure(exception, logger);

    expect(logger.error).toHaveBeenCalledWith('service=gateway status=500');
    const output = logger.error.mock.calls.flat().join(' ');
    expect(output).not.toContain('SENTINEL_BOOTSTRAP_ERROR');
    expect(output).not.toContain('SENTINEL_BOOTSTRAP_STACK');
  });
});
