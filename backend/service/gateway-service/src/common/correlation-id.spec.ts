import { ensureCorrelationId, getCorrelationId } from "./correlation-id";

describe("correlation-id", () => {
  it("preserves a valid client correlation id", () => {
    const request = {
      headers: { "x-correlation-id": "client-reference-123" },
    };

    expect(ensureCorrelationId(request)).toBe("client-reference-123");
    expect(getCorrelationId(request)).toBe("client-reference-123");
  });

  it("generates and stores a reference when the client omits one", () => {
    const request = { headers: {} as Record<string, string> };

    const correlationId = ensureCorrelationId(request);

    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(request.headers["x-correlation-id"]).toBe(correlationId);
    expect(getCorrelationId(request)).toBe(correlationId);
  });
});
