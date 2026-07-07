import { z } from "zod";
import { env } from "@/shared/lib/env";
import { logger } from "@/shared/lib/logger";
import { toSafeError, UnauthenticatedError } from "@/shared/lib/errors";
import {
  processStripeEvent,
  type NormalizedStripeEvent,
} from "../application/process-stripe-event";
import { prismaBillingSyncRepository } from "../infrastructure/prisma-billing-sync-repository";
import { stripe } from "../infrastructure/stripe-client";

/**
 * Inbound edge: Stripe webhook. Signature verified BEFORE parsing (COD-010); payload
 * fields are extracted with zod instead of trusting SDK types across API versions.
 * Non-2xx responses make Stripe retry — used deliberately for out-of-order delivery.
 */

const id = z.object({ id: z.string() });
const customerRef = z.union([z.string(), id]).transform((c) => (typeof c === "string" ? c : c.id));

const checkoutSession = z.object({
  customer: customerRef,
  subscription: z.union([z.string(), id]).nullish(),
  metadata: z.object({ organizationId: z.string() }),
});

const subscriptionObject = z.object({
  id: z.string(),
  customer: customerRef,
  status: z.string(),
  cancel_at_period_end: z.boolean().default(false),
  items: z.object({
    data: z.array(
      z.object({
        quantity: z.number().int().positive().default(1),
        current_period_end: z.number().nullish(),
        price: z.object({ id: z.string(), lookup_key: z.string().nullish() }),
      }),
    ),
  }),
});

const invoiceObject = z.object({ customer: customerRef });

function normalize(eventId: string, type: string, object: unknown): NormalizedStripeEvent {
  const base: NormalizedStripeEvent = { id: eventId, type };
  switch (type) {
    case "checkout.session.completed": {
      const s = checkoutSession.parse(object);
      const sub = s.subscription ?? null;
      base.checkout = {
        organizationId: s.metadata.organizationId,
        stripeCustomerId: s.customer,
        stripeSubscriptionId: sub === null ? null : typeof sub === "string" ? sub : sub.id,
      };
      return base;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const s = subscriptionObject.parse(object);
      const item = s.items.data[0];
      base.subscription = {
        stripeCustomerId: s.customer,
        stripeSubscriptionId: s.id,
        stripeStatus: s.status,
        tier: item?.price.lookup_key ?? item?.price.id ?? "unknown",
        seats: item?.quantity ?? 1,
        currentPeriodEnd:
          item?.current_period_end != null ? new Date(item.current_period_end * 1000) : null,
        cancelAtPeriodEnd: s.cancel_at_period_end,
      };
      return base;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      base.invoice = { stripeCustomerId: invoiceObject.parse(object).customer };
      return base;
    }
    default:
      return base; // unmapped types flow through and are acknowledged (invariant 3)
  }
}

export async function POST(request: Request): Promise<Response> {
  const log = logger.child({ handler: "stripe-webhook" });
  try {
    const secret = env().STRIPE_WEBHOOK_SIGNING_SECRET;
    if (secret === undefined) {
      throw new UnauthenticatedError("STRIPE_WEBHOOK_SIGNING_SECRET is not configured");
    }
    const body = await request.text();
    let event: { id: string; type: string; data: { object: unknown } };
    try {
      event = stripe().webhooks.constructEvent(
        body,
        request.headers.get("stripe-signature") ?? "",
        secret,
      );
    } catch {
      throw new UnauthenticatedError("Invalid webhook signature");
    }

    const result = await processStripeEvent(
      normalize(event.id, event.type, event.data.object),
      prismaBillingSyncRepository,
    );
    if (result === "unresolved_customer") {
      // 409 -> Stripe redelivers after checkout.session.completed lands.
      return Response.json({ received: false, retry: true }, { status: 409 });
    }
    log.info("stripe event handled", { type: event.type, result });
    return Response.json({ received: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("stripe payload rejected", { issues: error.issues.length });
      return Response.json(
        { error: { code: "validation_failed", message: "Unparseable webhook payload" } },
        { status: 400 },
      );
    }
    const safe = toSafeError(error);
    log.error("stripe webhook failed", {
      status: safe.status,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json(safe.body, { status: safe.status });
  }
}
