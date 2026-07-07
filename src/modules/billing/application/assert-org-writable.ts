import { PermissionDeniedError } from "@/shared/lib/errors";
import { dbForOrg } from "@/shared/lib/prisma";
import { isWriteBlocked, type SubscriptionStatusValue } from "../domain/subscription-status";

/**
 * The unpaid-lockout guard (public API — other modules call this from their write
 * paths, AFTER requirePermission). No Subscription row = still onboarding = writable;
 * billing:* interfaces must NOT call this (recovery stays possible — invariant 2).
 */
export async function assertOrgWritable(organizationId: string): Promise<void> {
  const subscription = await dbForOrg(organizationId).subscription.findUnique({
    where: { organizationId },
    select: { status: true },
  });
  if (subscription !== null && isWriteBlocked(subscription.status as SubscriptionStatusValue)) {
    throw new PermissionDeniedError("organization is locked (subscription inactive)");
  }
}
