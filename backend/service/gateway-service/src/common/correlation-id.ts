import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
type CorrelatedRequest = Pick<Request, "headers"> & {
  correlationId?: string;
};

export function getCorrelationId(request: CorrelatedRequest): string {
  if (
    typeof request.correlationId === "string" &&
    CORRELATION_ID_PATTERN.test(request.correlationId)
  ) {
    return request.correlationId;
  }
  const raw = request.headers["x-correlation-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && CORRELATION_ID_PATTERN.test(value)
    ? value
    : "unknown";
}

export function ensureCorrelationId(request: CorrelatedRequest): string {
  const existing = getCorrelationId(request);
  if (existing !== "unknown") return existing;

  const correlationId = randomUUID();
  request.correlationId = correlationId;
  request.headers["x-correlation-id"] = correlationId;
  return correlationId;
}

export function setCorrelationId(
  response: Pick<Response, "setHeader">,
  correlationId: string,
): void {
  if (correlationId !== "unknown" && typeof response.setHeader === "function") {
    response.setHeader("X-Correlation-ID", correlationId);
  }
}
