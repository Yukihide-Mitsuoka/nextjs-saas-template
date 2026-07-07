import { env } from "./env";
import { logger } from "./logger";

/**
 * Operational notifications (billing failures, security events) — a port so the template
 * stays vendor-neutral. Ships a Slack Incoming Webhook adapter and a log adapter; an
 * email adapter is a deployment concern (implement NotificationPort with your vendor).
 */

export interface Notification {
  title: string;
  body: string;
  severity?: "info" | "warning" | "critical";
}

export interface NotificationPort {
  notify(notification: Notification): Promise<void>;
}

export const logNotifier: NotificationPort = {
  async notify(n) {
    logger.info(`notify(dev): ${n.title}`, { body: n.body, severity: n.severity ?? "info" });
  },
};

const SEVERITY_EMOJI = { info: "ℹ️", warning: "⚠️", critical: "🚨" } as const;

/** Slack Incoming Webhook adapter (SLACK_WEBHOOK_URL). Failures are logged, never thrown
 *  — a down notifier must not take a request or webhook handler down with it. */
export const slackNotifier: NotificationPort = {
  async notify(n) {
    const url = env().SLACK_WEBHOOK_URL;
    if (url === undefined) {
      await logNotifier.notify(n);
      return;
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${SEVERITY_EMOJI[n.severity ?? "info"]} *${n.title}*\n${n.body}`,
        }),
      });
      if (!res.ok) logger.error("slack notification failed", { status: res.status });
    } catch (error) {
      logger.error("slack notification failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
};

/** Environment-appropriate notifier. */
export function notifier(): NotificationPort {
  return env().SLACK_WEBHOOK_URL !== undefined ? slackNotifier : logNotifier;
}
