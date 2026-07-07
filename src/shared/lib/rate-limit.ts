import { appDb } from "./prisma";

/**
 * Sliding-window rate limiting over Postgres (zero extra infrastructure). The store is
 * a port: swap in Redis later without touching call sites. Compose keys yourself, e.g.
 * `checkout:${organizationId}` or `webhook:${ip}`.
 */

export interface RateLimitStore {
  record(key: string, at: Date): Promise<void>;
  countSince(key: string, since: Date): Promise<number>;
  prune(key: string, before: Date): Promise<void>;
}

export interface RateLimitDecision {
  allowed: boolean;
  count: number;
  limit: number;
}

/** Pure decision flow — unit-testable with an in-memory store and injected clock. */
export async function slidingWindowLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number,
  now: Date = new Date(),
): Promise<RateLimitDecision> {
  const since = new Date(now.getTime() - windowMs);
  await store.record(key, now);
  const count = await store.countSince(key, since);
  // Opportunistic cleanup: at most one prune per denied request keeps the table bounded
  // without a scheduled job.
  if (count > limit) await store.prune(key, since);
  return { allowed: count <= limit, count, limit };
}

export const prismaRateLimitStore: RateLimitStore = {
  async record(key, at) {
    await appDb.rateLimitEvent.create({ data: { key, at } });
  },
  async countSince(key, since) {
    return appDb.rateLimitEvent.count({ where: { key, at: { gte: since } } });
  },
  async prune(key, before) {
    await appDb.rateLimitEvent.deleteMany({ where: { key, at: { lt: before } } });
  },
};

/** Convenience wrapper with the Prisma store. Throws nothing — callers decide (return
 *  429 from interfaces; queue-side callers may delay instead). */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitDecision> {
  return slidingWindowLimit(prismaRateLimitStore, key, limit, windowMs);
}
