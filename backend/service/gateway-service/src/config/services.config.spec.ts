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

  it('routes booking chatbot traffic to the LangGraph service', () => {
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
});
