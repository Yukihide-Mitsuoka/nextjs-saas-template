import { describe, expect, it } from "vitest";
import {
  InfrastructureError,
  NotFoundError,
  PermissionDeniedError,
  toSafeError,
  ValidationError,
} from "@/shared/lib/errors";

describe("toSafeError", () => {
  it("exposes domain errors verbatim with their status", () => {
    expect(toSafeError(new NotFoundError("Workspace", "ws_1"))).toEqual({
      status: 404,
      body: { error: { code: "not_found", message: "Workspace ws_1 not found" } },
    });
    expect(toSafeError(new PermissionDeniedError("billing:write")).status).toBe(403);
    expect(toSafeError(new ValidationError("bad input")).status).toBe(400);
  });

  it("never leaks infrastructure error details", () => {
    const safe = toSafeError(new InfrastructureError("pg: connection to 10.0.0.5 refused"));
    expect(safe.status).toBe(500);
    expect(safe.body.error.message).toBe("Internal server error");
    expect(JSON.stringify(safe)).not.toContain("10.0.0.5");
  });

  it("treats unknown thrown values as internal", () => {
    expect(toSafeError(new Error("boom"))).toEqual({
      status: 500,
      body: { error: { code: "internal", message: "Internal server error" } },
    });
    expect(toSafeError("string throw").status).toBe(500);
  });
});
