import { env } from "./env";
import { InfrastructureError } from "./errors";
import { logger } from "./logger";

/**
 * Background work port. Production adapter targets Cloud Tasks via its REST API with the
 * Cloud Run metadata-server token — zero extra npm dependencies. Tasks call back into
 * this app over HTTP with an OIDC token minted for the invoker service account.
 */

export interface QueueTask {
  /** Absolute URL the task will POST to (a route under /api/tasks/...). */
  url: string;
  payload: Record<string, unknown>;
  delaySeconds?: number;
}

export interface QueuePort {
  enqueue(task: QueueTask): Promise<void>;
}

/** Local/dev adapter: runs nothing, logs what would have been enqueued. */
export const logQueue: QueuePort = {
  async enqueue(task) {
    logger.info("queue(dev): task logged, not executed", { url: task.url });
  },
};

async function metadataAccessToken(): Promise<string> {
  const res = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!res.ok) {
    throw new InfrastructureError(`metadata server token fetch failed (${res.status})`);
  }
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

/** Cloud Tasks adapter. Requires CLOUD_TASKS_QUEUE (full resource name) and
 *  CLOUD_TASKS_INVOKER_SA; runs on GCP (metadata server). */
export const cloudTasksQueue: QueuePort = {
  async enqueue(task) {
    const queue = env().CLOUD_TASKS_QUEUE;
    const invoker = env().CLOUD_TASKS_INVOKER_SA;
    if (queue === undefined || invoker === undefined) {
      throw new InfrastructureError("CLOUD_TASKS_QUEUE / CLOUD_TASKS_INVOKER_SA not configured");
    }
    const token = await metadataAccessToken();
    const res = await fetch(`https://cloudtasks.googleapis.com/v2/${queue}/tasks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        task: {
          httpRequest: {
            httpMethod: "POST",
            url: task.url,
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify(task.payload)).toString("base64"),
            oidcToken: { serviceAccountEmail: invoker },
          },
          ...(task.delaySeconds !== undefined && {
            scheduleTime: new Date(Date.now() + task.delaySeconds * 1000).toISOString(),
          }),
        },
      }),
    });
    if (!res.ok) {
      throw new InfrastructureError(`Cloud Tasks enqueue failed (${res.status})`);
    }
  },
};

/** Environment-appropriate queue: Cloud Tasks when configured, log adapter otherwise. */
export function queue(): QueuePort {
  return env().CLOUD_TASKS_QUEUE !== undefined ? cloudTasksQueue : logQueue;
}
