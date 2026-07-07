import { Webhook } from "svix";
import { z } from "zod";
import { env } from "@/shared/lib/env";
import { logger } from "@/shared/lib/logger";
import { toSafeError, UnauthenticatedError, ValidationError } from "@/shared/lib/errors";
import { syncFromClerk, type ClerkSyncEvent } from "../application/sync-from-clerk";
import { prismaIdentitySyncRepository } from "../infrastructure/prisma-identity-sync-repository";

/**
 * Inbound edge: Clerk webhook (svix-signed). Verification happens BEFORE parsing
 * (COD-010: validate at the boundary); an invalid signature is a 401, a payload we
 * cannot parse is a 400 — Clerk retries non-2xx deliveries.
 */

const userPayload = z.object({
  id: z.string(),
  email_addresses: z.array(z.object({ id: z.string(), email_address: z.string() })),
  primary_email_address_id: z.string().nullish(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  image_url: z.string().nullish(),
});

const organizationPayload = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_by: z.string().nullish(),
});

const membershipPayload = z.object({
  organization: z.object({ id: z.string() }),
  public_user_data: z.object({ user_id: z.string() }),
  role: z.string(),
});

const envelope = z.object({ type: z.string(), data: z.unknown() });

function toDomainEvent(type: string, data: unknown): ClerkSyncEvent | null {
  switch (type) {
    case "user.created":
    case "user.updated": {
      const u = userPayload.parse(data);
      const primary =
        u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses[0];
      if (primary === undefined) {
        throw new ValidationError("user event without an email address");
      }
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
      return {
        type,
        user: {
          clerkUserId: u.id,
          email: primary.email_address,
          name,
          imageUrl: u.image_url ?? null,
        },
      };
    }
    case "user.deleted": {
      const u = z.object({ id: z.string() }).parse(data);
      return { type, clerkUserId: u.id };
    }
    case "organization.created":
    case "organization.updated": {
      const o = organizationPayload.parse(data);
      return {
        type,
        organization: {
          clerkOrgId: o.id,
          name: o.name,
          slug: o.slug,
          createdByClerkUserId: o.created_by ?? null,
        },
      };
    }
    case "organization.deleted": {
      const o = z.object({ id: z.string() }).parse(data);
      return { type, clerkOrgId: o.id };
    }
    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const m = membershipPayload.parse(data);
      return {
        type,
        membership: {
          clerkOrgId: m.organization.id,
          clerkUserId: m.public_user_data.user_id,
          providerRole: m.role,
        },
      };
    }
    case "organizationMembership.deleted": {
      const m = membershipPayload.parse(data);
      return { type, clerkOrgId: m.organization.id, clerkUserId: m.public_user_data.user_id };
    }
    default:
      return null; // event types we do not mirror — acknowledge and ignore
  }
}

export async function POST(request: Request): Promise<Response> {
  const log = logger.child({ handler: "clerk-webhook" });
  try {
    const secret = env().CLERK_WEBHOOK_SIGNING_SECRET;
    if (secret === undefined) {
      throw new UnauthenticatedError("CLERK_WEBHOOK_SIGNING_SECRET is not configured");
    }

    const body = await request.text();
    let verified: unknown;
    try {
      verified = new Webhook(secret).verify(body, {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      });
    } catch {
      throw new UnauthenticatedError("Invalid webhook signature");
    }

    const { type, data } = envelope.parse(verified);
    const event = toDomainEvent(type, data);
    if (event === null) {
      log.debug("ignoring unmirrored event", { type });
      return Response.json({ received: true, ignored: true });
    }

    await syncFromClerk(event, prismaIdentitySyncRepository);
    log.info("synced", { type });
    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const safe = toSafeError(new ValidationError("Unparseable webhook payload"));
      log.warn("webhook payload rejected", { issues: error.issues.length });
      return Response.json(safe.body, { status: safe.status });
    }
    const safe = toSafeError(error);
    log.error("webhook processing failed", {
      status: safe.status,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json(safe.body, { status: safe.status });
  }
}
