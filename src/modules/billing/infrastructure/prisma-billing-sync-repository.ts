import { Prisma } from "@prisma/client";
import { adminDb } from "@/shared/lib/prisma";
import type { BillingSyncRepository, SubscriptionUpsert } from "../application/ports";
import type { SubscriptionStatusValue } from "../domain/subscription-status";

/** Privileged-client implementation — third adminDb consumer, scope per ADR-0003. */
export const prismaBillingSyncRepository: BillingSyncRepository = {
  async claimEvent(eventId: string, type: string) {
    try {
      await adminDb.stripeEvent.create({ data: { id: eventId, type } });
      return true;
    } catch (error) {
      // Unique violation on the primary key = already claimed.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return false;
      }
      throw error;
    }
  },

  async organizationIdForCustomer(stripeCustomerId: string) {
    const row = await adminDb.subscription.findUnique({
      where: { stripeCustomerId },
      select: { organizationId: true },
    });
    return row?.organizationId ?? null;
  },

  async upsertSubscription(s: SubscriptionUpsert) {
    await adminDb.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { organizationId: s.organizationId },
        create: {
          organizationId: s.organizationId,
          stripeCustomerId: s.stripeCustomerId,
          stripeSubscriptionId: s.stripeSubscriptionId,
          status: s.status,
          tier: s.tier,
          seats: s.seats,
          currentPeriodEnd: s.currentPeriodEnd,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        },
        update: {
          stripeCustomerId: s.stripeCustomerId,
          stripeSubscriptionId: s.stripeSubscriptionId,
          status: s.status,
          tier: s.tier,
          seats: s.seats,
          currentPeriodEnd: s.currentPeriodEnd,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: s.organizationId,
          actorUserId: null, // system action (webhook)
          action: "billing.subscription_synced",
          targetType: "Subscription",
          targetId: s.stripeSubscriptionId,
          metadata: { status: s.status, tier: s.tier, seats: s.seats },
        },
      });
    });
  },

  async markStatus(stripeCustomerId: string, status: SubscriptionStatusValue) {
    await adminDb.subscription.updateMany({
      where: { stripeCustomerId },
      data: { status },
    });
  },
};
