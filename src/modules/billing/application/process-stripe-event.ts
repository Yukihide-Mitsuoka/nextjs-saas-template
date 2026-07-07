import { logger } from "@/shared/lib/logger";
import { mapStripeStatus } from "../domain/subscription-status";
import type { BillingSyncRepository } from "./ports";

/**
 * Use case: apply one signature-verified Stripe event, exactly once.
 * The interface layer normalizes Stripe payloads into this stripe-sdk-free shape.
 */

export type NormalizedStripeEvent = {
  id: string;
  type: string;
  /** checkout.session.completed */
  checkout?: {
    organizationId: string; // from session metadata we set at creation
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
  };
  /** customer.subscription.created/updated/deleted */
  subscription?: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeStatus: string;
    tier: string;
    seats: number;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  };
  /** invoice.paid / invoice.payment_failed */
  invoice?: { stripeCustomerId: string };
};

export type ProcessResult = "processed" | "duplicate" | "ignored" | "unresolved_customer";

export async function processStripeEvent(
  event: NormalizedStripeEvent,
  repository: BillingSyncRepository,
): Promise<ProcessResult> {
  // Invariant 1: claim BEFORE any side effect — replays and redeliveries become no-ops.
  if (!(await repository.claimEvent(event.id, event.type))) {
    logger.info("billing: duplicate event skipped", { eventId: event.id, type: event.type });
    return "duplicate";
  }

  switch (event.type) {
    case "checkout.session.completed": {
      if (event.checkout === undefined) return "ignored";
      const c = event.checkout;
      await repository.upsertSubscription({
        organizationId: c.organizationId,
        stripeCustomerId: c.stripeCustomerId,
        stripeSubscriptionId: c.stripeSubscriptionId,
        status: "ACTIVE",
        tier: "pending", // authoritative tier arrives with customer.subscription.updated
        seats: 1,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
      return "processed";
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      if (event.subscription === undefined) return "ignored";
      const s = event.subscription;
      const organizationId = await repository.organizationIdForCustomer(s.stripeCustomerId);
      if (organizationId === null) {
        // checkout.session.completed may not have landed yet; Stripe retries on non-2xx.
        logger.warn("billing: subscription event for unknown customer", { eventId: event.id });
        return "unresolved_customer";
      }
      await repository.upsertSubscription({
        organizationId,
        stripeCustomerId: s.stripeCustomerId,
        stripeSubscriptionId: s.stripeSubscriptionId,
        status:
          event.type === "customer.subscription.deleted"
            ? "CANCELED"
            : mapStripeStatus(s.stripeStatus),
        tier: s.tier,
        seats: s.seats,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      });
      return "processed";
    }

    case "invoice.paid": {
      if (event.invoice === undefined) return "ignored";
      await repository.markStatus(event.invoice.stripeCustomerId, "ACTIVE");
      return "processed";
    }

    case "invoice.payment_failed": {
      if (event.invoice === undefined) return "ignored";
      // Grace, not lockout (invariant 2): PAST_DUE while Stripe dunning retries.
      await repository.markStatus(event.invoice.stripeCustomerId, "PAST_DUE");
      return "processed";
    }

    default:
      // Invariant 3: acknowledge without side effects (the claim above is intentional —
      // an ignored type stays ignored on redelivery too).
      return "ignored";
  }
}
