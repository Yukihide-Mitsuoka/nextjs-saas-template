/** Domain rules for subscription state — plain logic, no framework imports (ARC-002). */

export type SubscriptionStatusValue =
  "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

/** Stripe subscription status → our enum. Unknown values degrade to INCOMPLETE (never
 *  silently ACTIVE). */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatusValue {
  switch (stripeStatus) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

/**
 * The lockout rule (MODULE.md invariant 2): grace during past_due (Stripe dunning is
 * retrying), hard read-only once the subscription is gone. billing:* paths must stay
 * open regardless, so recovery is possible — callers enforce that exception.
 */
export function isWriteBlocked(status: SubscriptionStatusValue): boolean {
  return status === "CANCELED" || status === "INCOMPLETE";
}
