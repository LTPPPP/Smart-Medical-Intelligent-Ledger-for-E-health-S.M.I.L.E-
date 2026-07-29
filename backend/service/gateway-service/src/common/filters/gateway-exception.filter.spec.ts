import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { GatewayExceptionFilter } from './gateway-exception.filter';

function createHost(statusCode = 0) {
  const response = {
    statusCode,
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = {
    method: 'POST',
    originalUrl:
      '/api/v1/patients/PAT-SENTINEL-PATIENT-CODE/medical-records/123e4567-e89b-42d3-a456-426614174000?token=SENTINEL_QUERY_TOKEN',
    headers: {
      'x-correlation-id': 'correlation-errors',
    },
  };
  return {
    response,
    host: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    },
  };
}

describe('GatewayExceptionFilter', () => {
  it('logs 4xx as a sanitized warning without error or stack', () => {
    const filter = new GatewayExceptionFilter();
    const warn = jest
      .spyOn((filter as any).logger, 'warn')
      .mockImplementation();
    const error = jest
      .spyOn((filter as any).logger, 'error')
      .mockImplementation();
    const { response, host } = createHost();

    filter.catch(
      new BadRequestException('SENTINEL_BAD_REQUEST_TOKEN'),
      host as any,
    );

    const output = warn.mock.calls.flat().join(' ');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    expect(output).toContain('method=POST');
    expect(output).toContain(
      'path=/api/v1/patients/:id/medical-records/:id',
    );
    expect(output).toContain('status=400');
    expect(output).toContain('correlationId=correlation-errors');
    expect(output).not.toContain('SENTINEL_BAD_REQUEST_TOKEN');
    expect(output).not.toContain('SENTINEL_QUERY_TOKEN');
    expect(output).not.toContain('PAT-SENTINEL-PATIENT-CODE');
    expect(output).not.toContain('123e4567-e89b-42d3-a456-426614174000');
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/api/v1/patients/:id/medical-records/:id',
      }),
    );
  });

  it('logs 500 as a sanitized error without raw message or stack', () => {
    const filter = new GatewayExceptionFilter();
    const warn = jest
      .spyOn((filter as any).logger, 'warn')
      .mockImplementation();
    const error = jest
      .spyOn((filter as any).logger, 'error')
      .mockImplementation();
    const { response, host } = createHost();
    const exception = new InternalServerErrorException(
      'SENTINEL_INTERNAL_ERROR_TOKEN',
    );
    exception.stack = 'SENTINEL_STACK_TOKEN';

    filter.catch(exception, host as any);

    const output = error.mock.calls.flat().join(' ');
    expect(error).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    expect(output).toContain('status=500');
    expect(output).toContain(
      'path=/api/v1/patients/:id/medical-records/:id',
    );
    expect(output).toContain('correlationId=correlation-errors');
    expect(output).not.toContain('SENTINEL_INTERNAL_ERROR_TOKEN');
    expect(output).not.toContain('SENTINEL_STACK_TOKEN');
    expect(output).not.toContain('PAT-SENTINEL-PATIENT-CODE');
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/api/v1/patients/:id/medical-records/:id',
      }),
    );
  });
});
