import { describe, expect, it, vi } from "vitest";
import type { BillingSyncRepository } from "@/modules/billing/application/ports";
import { processStripeEvent } from "@/modules/billing/application/process-stripe-event";
import { isWriteBlocked, mapStripeStatus } from "@/modules/billing/domain/subscription-status";

function fakeRepo(overrides: Partial<BillingSyncRepository> = {}): BillingSyncRepository {
  return {
    claimEvent: vi.fn(async () => true),
    organizationIdForCustomer: vi.fn(async () => "org_1"),
    upsertSubscription: vi.fn(async () => {}),
    markStatus: vi.fn(async () => {}),
    ...overrides,
  };
}

const subEvent = {
  id: "evt_1",
  type: "customer.subscription.updated",
  subscription: {
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeStatus: "active",
    tier: "pro",
    seats: 5,
    currentPeriodEnd: new Date("2026-08-01"),
    cancelAtPeriodEnd: false,
  },
};

describe("processStripeEvent", () => {
  it("claims the event id before side effects and skips duplicates (invariant 1)", async () => {
    const repo = fakeRepo({ claimEvent: vi.fn(async () => false) });
    expect(await processStripeEvent(subEvent, repo)).toBe("duplicate");
    expect(repo.upsertSubscription).not.toHaveBeenCalled();
  });

  it("syncs subscription state with mapped status", async () => {
    const repo = fakeRepo();
    expect(await processStripeEvent(subEvent, repo)).toBe("processed");
    expect(repo.upsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org_1", status: "ACTIVE", seats: 5 }),
    );
  });

  it("asks for redelivery when the customer is not yet known", async () => {
    const repo = fakeRepo({ organizationIdForCustomer: vi.fn(async () => null) });
    expect(await processStripeEvent(subEvent, repo)).toBe("unresolved_customer");
    expect(repo.upsertSubscription).not.toHaveBeenCalled();
  });

  it("marks PAST_DUE on payment failure (grace, not lockout — invariant 2)", async () => {
    const repo = fakeRepo();
    await processStripeEvent(
      { id: "evt_2", type: "invoice.payment_failed", invoice: { stripeCustomerId: "cus_1" } },
      repo,
    );
    expect(repo.markStatus).toHaveBeenCalledWith("cus_1", "PAST_DUE");
  });

  it("acknowledges unmapped event types without side effects (invariant 3)", async () => {
    const repo = fakeRepo();
    expect(await processStripeEvent({ id: "evt_3", type: "charge.refunded" }, repo)).toBe(
      "ignored",
    );
    expect(repo.upsertSubscription).not.toHaveBeenCalled();
    expect(repo.markStatus).not.toHaveBeenCalled();
  });
});

describe("subscription status rules", () => {
  it("maps stripe statuses, degrading unknowns to INCOMPLETE", () => {
    expect(mapStripeStatus("trialing")).toBe("TRIALING");
    expect(mapStripeStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeStatus("unpaid")).toBe("CANCELED");
    expect(mapStripeStatus("something_new")).toBe("INCOMPLETE");
  });

  it("blocks writes only for CANCELED/INCOMPLETE — past_due keeps grace (invariant 2)", () => {
    expect(isWriteBlocked("PAST_DUE")).toBe(false);
    expect(isWriteBlocked("ACTIVE")).toBe(false);
    expect(isWriteBlocked("TRIALING")).toBe(false);
    expect(isWriteBlocked("CANCELED")).toBe(true);
    expect(isWriteBlocked("INCOMPLETE")).toBe(true);
  });
});
