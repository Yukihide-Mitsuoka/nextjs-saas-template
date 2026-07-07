import type { SubscriptionStatusValue } from "../domain/subscription-status";

export interface SubscriptionUpsert {
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatusValue;
  tier: string;
  seats: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/** Webhook-side persistence port (privileged client — ADR-0003 scope). */
export interface BillingSyncRepository {
  /** Atomically claim an event id; false = already processed (replay/redelivery). */
  claimEvent(eventId: string, type: string): Promise<boolean>;
  /** Resolve which org a Stripe customer belongs to (cross-tenant by nature). */
  organizationIdForCustomer(stripeCustomerId: string): Promise<string | null>;
  upsertSubscription(subscription: SubscriptionUpsert): Promise<void>;
  markStatus(stripeCustomerId: string, status: SubscriptionStatusValue): Promise<void>;
}
