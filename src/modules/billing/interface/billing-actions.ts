"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { resolveActor } from "@/modules/identity/application/resolve-actor";
import { requirePermission } from "@/shared/auth/guard";
import { env } from "@/shared/lib/env";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";
import { dbForOrg } from "@/shared/lib/prisma";
import { stripe } from "../infrastructure/stripe-client";

/**
 * Server actions (inbound edge). Defense in depth: Clerk session -> resolveActor
 * (identity module's public API) -> requirePermission — even though the UI hides
 * billing from non-billing roles.
 */

async function billingActor(): Promise<{ userId: string; organizationId: string }> {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const actor = await resolveActor(clerkUserId, clerkOrgId);
  await requirePermission(actor.userId, actor.organizationId, "billing:write");
  return actor;
}

const priceInput = z.object({ priceId: z.string().min(1) });

/** Start a subscription purchase — returns the Stripe Checkout URL to redirect to. */
export async function createCheckoutSession(input: { priceId: string }): Promise<string> {
  const parsed = priceInput.safeParse(input);
  if (!parsed.success) throw new ValidationError("priceId is required");
  const { organizationId } = await billingActor();

  const existing = await dbForOrg(organizationId).subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  });

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: existing?.stripeCustomerId,
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    // The webhook resolves the org from this — the one place the linkage is established.
    metadata: { organizationId },
    subscription_data: { metadata: { organizationId } },
    success_url: `${env().APP_URL}/billing?status=success`,
    cancel_url: `${env().APP_URL}/billing?status=canceled`,
  });
  if (session.url === null) throw new NotFoundError("checkout session URL");
  return session.url;
}

/** Open the Stripe Customer Portal (plan changes, payment method, invoices). */
export async function createPortalSession(): Promise<string> {
  const { organizationId } = await billingActor();

  const subscription = await dbForOrg(organizationId).subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  });
  if (subscription === null) throw new NotFoundError("subscription", organizationId);

  const session = await stripe().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env().APP_URL}/billing`,
  });
  return session.url;
}
