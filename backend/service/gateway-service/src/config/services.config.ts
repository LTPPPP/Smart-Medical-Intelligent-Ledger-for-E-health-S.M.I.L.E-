import { registerAs } from "@nestjs/config";

export interface ServiceRoute {
  prefixes: string[];
  target: string;
  pathRewrite: Record<string, string>;
  name: string;
  healthPath: string;
}

export const servicesConfig = registerAs("services", () => ({
  gateway: {
    port: parseInt(process.env.APP_PORT || "3000", 10),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || "30000", 10),
  },

  // Shared Redis Instance
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379/0",
  },

  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== "false",
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || "60", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300", 10),
  },

  routes: [
    // IAM Service
    {
      name: "iam-service",
      target: process.env.IAM_SERVICE_URL || "http://localhost:3001",
      prefixes: ["/api/v1/auth"],
      pathRewrite: { "^/api/v1/auth": "/v1/auth" },
      healthPath: "/docs",
    },

    // IAM RBAC Routes
    {
      name: "iam-service",
      target: process.env.IAM_SERVICE_URL || "http://localhost:3001",
      prefixes: [
        "/api/v1/accounts",
        "/api/v1/user-profiles",
        "/api/v1/roles",
        "/api/v1/permissions",
        "/api/v1/user-roles",
        "/api/v1/kyc",
        "/api/v1/audit-logs",
        "/api/v1/notifications",
        "/api/v1/notification-templates",
        "/api/v1/notification-preferences",
        "/api/v1/kyc",
      ],
      pathRewrite: { "^/api/v1": "/v1" },
      healthPath: "/api",
    },

    // Clinical Core Routes
    {
      name: "clinical-emr-service",
      target: process.env.CLINICAL_EMR_SERVICE_URL || "http://localhost:8082",
      prefixes: [
        "/api/v1/clinics",
        "/api/v1/treatment-rooms",
        "/api/v1/specialties",
        "/api/v1/service-categories",
        "/api/v1/services",
        "/api/v1/doctor-specialties",
        "/api/v1/work-shifts",
        "/api/v1/doctor-schedules",
        "/api/v1/doctor-leaves",
        "/api/v1/clinic-services",
        "/api/v1/appointments",
        "/api/v1/reports",
        "/api/v1/diagnostic-orders",
        "/api/v1/reports",
      ],
      pathRewrite: {},
      healthPath: "/docs",
    },

    // Clinical Medical Routes
    {
      name: "clinical-emr-service",
      target: process.env.CLINICAL_EMR_SERVICE_URL || "http://localhost:8082",
      prefixes: [
        "/api/v1/patients",
        "/api/v1/patient-representatives",
        "/api/v1/medical-records",
        "/api/v1/dental-images",
        "/api/v1/image-categories",
        "/api/v1/image-annotations",
        "/api/v1/examination-sessions",
        "/api/v1/clinical-orders",
        "/api/v1/symptoms",
        "/api/v1/treatment-plans",
        "/api/v1/prescriptions",
        "/api/v1/dental-charts",
        "/api/v1/diagnoses",
        "/api/v1/treatment-history",
        "/api/v1/prescription-items",
        "/api/v1/lab-test-results",
        "/api/v1/pacs-sync-logs",
        "/api/v1/record-exports",
      ],
      pathRewrite: { "^/api/v1": "/api" },
      healthPath: "/docs",
    },

    // ── AI Booking LangGraph Service ─────────────────────────────────────
    {
      name: "booking-langgraph-service",
      target: process.env.BOOKING_LANGGRAPH_SERVICE_URL || "http://localhost:8030",
      prefixes: ["/api/v1/ai/booking-chat"],
      pathRewrite: { "^/api/v1/ai/booking-chat": "" },
      healthPath: "/health",
    },

    // ── Payment Service ───────────────────────────────────────────────────
    {
      name: "payment-service",
      target: process.env.PAYMENT_SERVICE_URL || "http://localhost:3006",
      prefixes: ["/api/v1/payments"],
      pathRewrite: {},
      healthPath: "/docs",
    },

  ].filter(
    (route) =>
      process.env.AI_ROUTES_ENABLED === "true" ||
      route.name !== "booking-langgraph-service",
  ) as ServiceRoute[],
}));
