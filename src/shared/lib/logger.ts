import { env } from "./env";

/**
 * Structured JSON logging to stdout — Cloud Run/Cloud Logging parse JSON lines natively
 * (`severity` is the field Cloud Logging promotes to the log level).
 *
 * No transport dependency on purpose: stdout is the contract in containers. Monitoring
 * hooks (error tracking, alerting) subscribe via `onLog` without touching call sites.
 */

const LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LEVELS)[number];

const SEVERITY: Record<LogLevel, string> = {
  trace: "DEBUG",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
};

export type LogContext = Record<string, unknown>;

export interface LogRecord {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
}

type LogHook = (record: LogRecord) => void;

const hooks: LogHook[] = [];

/** Register a monitoring hook (e.g. forward `error` records to an alerting service). */
export function onLog(hook: LogHook): void {
  hooks.push(hook);
}

function enabled(level: LogLevel): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(env().LOG_LEVEL);
}

function emit(level: LogLevel, message: string, context: LogContext): void {
  if (!enabled(level)) return;
  const record: LogRecord = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  // Cloud Logging structured format: severity + message + flattened context.
  const line = JSON.stringify({
    severity: SEVERITY[level],
    message,
    timestamp: record.timestamp,
    ...context,
  });
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
  for (const hook of hooks) {
    try {
      hook(record);
    } catch {
      // A broken monitoring hook must never take the app down with it.
    }
  }
}

export interface Logger {
  trace(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** New logger with `context` merged into every record (request id, org id, ...). */
  child(context: LogContext): Logger;
}

function makeLogger(base: LogContext): Logger {
  const log =
    (level: LogLevel) =>
    (message: string, context: LogContext = {}) =>
      emit(level, message, { ...base, ...context });
  return {
    trace: log("trace"),
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    child: (context) => makeLogger({ ...base, ...context }),
  };
}

export const logger: Logger = makeLogger({});
