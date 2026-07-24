import { servicesConfig } from './services.config';

describe('servicesConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not expose booking chatbot traffic while AI routes are paused', () => {
    delete process.env.AI_ROUTES_ENABLED;
    delete process.env.BOOKING_LANGGRAPH_SERVICE_URL;

    const config = servicesConfig();

    expect(config.routes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'booking-langgraph-service' }),
      ]),
    );
  });

  it('routes booking chatbot traffic to the LangGraph service when enabled', () => {
    process.env.AI_ROUTES_ENABLED = 'true';
    process.env.BOOKING_LANGGRAPH_SERVICE_URL = 'http://booking-langgraph-service:8030';

    const config = servicesConfig();
    const route = config.routes.find((item) => item.name === 'booking-langgraph-service');

    expect(route).toEqual({
      name: 'booking-langgraph-service',
      target: 'http://booking-langgraph-service:8030',
      prefixes: ['/api/v1/ai/booking-chat'],
      pathRewrite: { '^/api/v1/ai/booking-chat': '' },
      healthPath: '/health',
    });
  });

  it('proxies patient representative routes to the clinical EMR service API namespace', () => {
    const config = servicesConfig();
    const route = config.routes.find((item) =>
      item.prefixes.includes('/api/v1/patient-representatives'),
    );

    expect(route).toEqual(
      expect.objectContaining({
        name: 'clinical-emr-service',
        pathRewrite: { '^/api/v1': '/api' },
      }),
    );
  });
});
