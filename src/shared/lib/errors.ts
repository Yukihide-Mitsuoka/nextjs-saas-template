/**
 * Error taxonomy — type-safe, layer-aware (COD-011: no silent failures).
 *
 * - DomainError family: expected business failures. Carry a stable `code`, an HTTP
 *   status mapping, and a client-safe message. Interface layers convert them to
 *   responses; they are control flow, not incidents.
 * - InfrastructureError: unexpected technical failure. Message is NOT client-safe
 *   (may contain connection details); interfaces log it and return a generic 500.
 * - toSafeError(): the single funnel every interface edge uses — nothing else decides
 *   what leaves the process.
 */

export type ErrorCode =
  | "validation_failed"
  | "not_found"
  | "permission_denied"
  | "unauthenticated"
  | "conflict"
  | "internal";

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly status: number;
  /** true = message may be shown to API/UI clients verbatim. */
  abstract readonly expose: boolean;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly code = "validation_failed";
  readonly status = 400;
  readonly expose = true;

  constructor(
    message: string,
    readonly issues: ReadonlyArray<{ path: string; message: string }> = [],
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = "not_found";
  readonly status = 404;
  readonly expose = true;

  constructor(resource: string, id?: string) {
    super(id ? `${resource} ${id} not found` : `${resource} not found`);
  }
}

export class UnauthenticatedError extends AppError {
  readonly code = "unauthenticated";
  readonly status = 401;
  readonly expose = true;

  constructor(message = "Authentication required") {
    super(message);
  }
}

export class PermissionDeniedError extends AppError {
  readonly code = "permission_denied";
  readonly status = 403;
  readonly expose = true;

  constructor(permission: string) {
    super(`Missing permission: ${permission}`);
  }
}

export class ConflictError extends AppError {
  readonly code = "conflict";
  readonly status = 409;
  readonly expose = true;
}

export class InfrastructureError extends AppError {
  readonly code = "internal";
  readonly status = 500;
  readonly expose = false;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export interface SafeError {
  status: number;
  body: { error: { code: ErrorCode; message: string } };
}

/** Convert anything thrown into a response-shaped, leak-free error. */
export function toSafeError(error: unknown): SafeError {
  if (error instanceof AppError && error.expose) {
    return { status: error.status, body: { error: { code: error.code, message: error.message } } };
  }
  return {
    status: error instanceof AppError ? error.status : 500,
    body: { error: { code: "internal", message: "Internal server error" } },
  };
}
